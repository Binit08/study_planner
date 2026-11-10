import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedContentSchema } from "@/lib/schemas/studySet";

/**
 * Normalizes and extracts clean JSON from LLM text output
 * even if surrounded by markdown code fences, comments, or leading/trailing text.
 */
export function extractJsonFromText(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Received empty or non-string response from Gemini");
  }

  const trimmed = rawText.trim();

  // Try direct parse first
  try {
    return JSON.parse(trimmed);
  } catch (e) {
    // Continue to regex extraction
  }

  // Check for ```json ... ``` or ``` ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (e) {
      // Continue to bracket search
    }
  }

  // Find outermost JSON object { ... }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {
      throw new Error("Failed to parse JSON from AI model response: " + e.message);
    }
  }

  throw new Error("No valid JSON structure found in AI response");
}

/**
 * Constructs Gemini response schema using official @google/genai Type enum
 */
function buildGeminiResponseSchema(mode) {
  const flashcardItemSchema = {
    type: Type.OBJECT,
    properties: {
      front: {
        type: Type.STRING,
        description: "Concise question, term, or prompt for the front of the flashcard",
      },
      back: {
        type: Type.STRING,
        description: "Clear, accurate answer or explanation for the back of the flashcard",
      },
    },
    required: ["front", "back"],
  };

  const quizItemSchema = {
    type: Type.OBJECT,
    properties: {
      question: {
        type: Type.STRING,
        description: "The conceptual or factual quiz question",
      },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Exactly four distinct answer choices",
      },
      correctAnswerIndex: {
        type: Type.INTEGER,
        description: "The 0-based index (0, 1, 2, or 3) of the correct answer in options",
      },
      explanation: {
        type: Type.STRING,
        description: "Detailed explanation of why this answer is correct",
      },
    },
    required: ["question", "options", "correctAnswerIndex", "explanation"],
  };

  const checklistItemSchema = {
    type: Type.OBJECT,
    properties: {
      task: {
        type: Type.STRING,
        description: "A concrete, actionable study or mastery milestone",
      },
      completed: {
        type: Type.BOOLEAN,
        description: "Initial completion status (false)",
      },
    },
    required: ["task"],
  };

  return {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "A crisp, descriptive title for the study set (3 to 6 words)",
      },
      topic: {
        type: Type.STRING,
        description: "The overarching academic subject or skill area",
      },
      summary: {
        type: Type.STRING,
        description: "A high-level 2-3 sentence overview of the study material",
      },
      mode: {
        type: Type.STRING,
        description: "The requested mode: flashcards, quiz, or both",
      },
      flashcards: {
        type: Type.ARRAY,
        items: flashcardItemSchema,
        description: "List of flashcard pairs (required when mode is flashcards or both)",
      },
      quiz: {
        type: Type.ARRAY,
        items: quizItemSchema,
        description: "List of multiple-choice questions (required when mode is quiz or both)",
      },
      checklist: {
        type: Type.ARRAY,
        items: checklistItemSchema,
        description: "Actionable study checklist items to track learning progress",
      },
    },
    required: ["title", "mode", "flashcards", "quiz"],
  };
}

/**
 * Main AI generation function using @google/genai
 */
export async function generateStudyContent({
  text,
  mode = "both",
  targetCount = 6,
  refinementPrompt,
  existingSet,
  signal,
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY is not configured in .env.local. Please provide a valid Google Gemini API key."
    );
  }

  const ai = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });

  let systemInstruction = `You are an elite academic study assistant and pedagogical expert.
Your job is to transform raw notes, articles, lecture slides, or topics into structured, interactive study materials.
You MUST output strictly valid JSON adhering exactly to the specified JSON schema.

Quality & Depth Guidelines:
- Concise or Syllabus Topics (e.g. "DSA", "Operating Systems", "Computer Networks"):
  Do NOT produce shallow or generic dictionary definitions. Synthesize university-grade, high-yield syllabus concepts.
  For example, for DSA: delve into amortized time/space complexities, tree/graph traversals (BFS/DFS, Dijkstra), collision resolution in hash tables, dynamic programming vs divide-and-conquer, and practical edge-case invariants.
- Flashcards: Front must be a thought-provoking question, formula, or term. Back must be comprehensive, clear, and easy to retain with concrete examples.
- Quizzes: Questions must test conceptual understanding and analytical application, not trivial verbatim recall. Provide 4 plausible options with exactly ONE correct answer. Provide a helpful, educational explanation.
- Study Checklist: Include 3-5 progressive action items to guide the student from initial review to mastery.
- Output MUST be valid JSON only. Never include conversational filler, markdown formatting outside of JSON, or apologies.`;

  let prompt = `SOURCE MATERIAL:\n${text}\n\n`;
  prompt += `REQUESTED FORMAT:
- Mode: ${mode}
- Target Item Count: approx ${targetCount} ${mode === "both" ? "flashcards and quiz questions each" : mode}.
`;

  if (refinementPrompt && existingSet) {
    prompt += `\nREFINEMENT INSTRUCTION:
The user has an existing study set and wants to refine it:
User request: "${refinementPrompt}"
Current Title: ${existingSet.title || "Untitled"}
Existing Flashcards count: ${existingSet.flashcards?.length || 0}
Existing Quiz count: ${existingSet.quiz?.length || 0}
Please apply the requested adjustments, additions, or corrections while preserving high pedagogical quality.`;
  }

  const responseSchema = buildGeminiResponseSchema(mode);

  try {
    // Check if client signal is already aborted
    if (signal?.aborted) {
      const abortError = new Error("Generation was cancelled by the user");
      abortError.name = "AbortError";
      throw abortError;
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.3,
        maxOutputTokens: 8192,
        abortSignal: signal,
        httpOptions: { timeout: 45000 },
      },
    });

    if (signal?.aborted) {
      const abortError = new Error("Generation was cancelled by the user");
      abortError.name = "AbortError";
      throw abortError;
    }

    const rawOutput = response.text;
    if (!rawOutput || rawOutput.trim().length === 0) {
      throw new Error("Gemini returned an empty response. The input material might be unclear or empty.");
    }

    const parsedJson = extractJsonFromText(rawOutput);

    // Ensure mode is set
    parsedJson.mode = mode;

    // Validate with Zod schema
    const validationResult = GeneratedContentSchema.safeParse(parsedJson);

    if (!validationResult.success) {
      console.warn("Zod schema validation issues encountered, attempting repair:", validationResult.error.format());

      // Healing/fallback logic to salvage valid items rather than failing the user completely
      const healed = {
        title: parsedJson.title || "Generated Study Set",
        topic: parsedJson.topic || "General Study",
        summary: parsedJson.summary || "",
        mode,
        flashcards: Array.isArray(parsedJson.flashcards)
          ? parsedJson.flashcards
              .filter((c) => c && typeof c.front === "string" && typeof c.back === "string")
              .map((c) => ({ front: c.front.trim(), back: c.back.trim() }))
          : [],
        quiz: Array.isArray(parsedJson.quiz)
          ? parsedJson.quiz
              .filter(
                (q) =>
                  q &&
                  typeof q.question === "string" &&
                  Array.isArray(q.options) &&
                  q.options.length >= 2
              )
              .map((q) => {
                // Ensure exactly 4 options
                const opts = q.options.slice(0, 4);
                while (opts.length < 4) {
                  opts.push(`Alternative option ${opts.length + 1}`);
                }
                const correctIdx =
                  typeof q.correctAnswerIndex === "number" &&
                  q.correctAnswerIndex >= 0 &&
                  q.correctAnswerIndex < 4
                    ? q.correctAnswerIndex
                    : 0;
                return {
                  question: q.question.trim(),
                  options: opts.map((o) => String(o).trim()),
                  correctAnswerIndex: correctIdx,
                  explanation: q.explanation || "Correct answer.",
                };
              })
          : [],
        checklist: Array.isArray(parsedJson.checklist)
          ? parsedJson.checklist
              .filter((i) => i && typeof i.task === "string")
              .map((i) => ({ task: i.task.trim(), completed: false }))
          : [],
      };

      const secondValidation = GeneratedContentSchema.safeParse(healed);
      if (secondValidation.success) {
        return secondValidation.data;
      }

      throw new Error(
        `Generated content could not be normalized into valid study schema: ${validationResult.error.issues.map((i) => i.message).join(", ")}`
      );
    }

    return validationResult.data;
  } catch (err) {
    if (err.name === "AbortError" || signal?.aborted) {
      throw err;
    }

    // Classify error for frontend user guidance
    const message = err.message || "";
    if (message.includes("API_KEY_INVALID") || message.includes("401") || message.includes("UNAUTHENTICATED")) {
      const e = new Error("Invalid Gemini API key. Please check your GEMINI_API_KEY in .env.local.");
      e.code = "INVALID_API_KEY";
      throw e;
    }
    if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.includes("quota")) {
      const e = new Error("Gemini API rate limit or quota exceeded. Please wait a moment and retry.");
      e.code = "RATE_LIMIT";
      throw e;
    }
    if (message.includes("SAFETY") || message.includes("blocked")) {
      const e = new Error("The content was blocked by Gemini safety filters. Try phrasing your notes differently.");
      e.code = "SAFETY_BLOCK";
      throw e;
    }

    throw err;
  }
}

