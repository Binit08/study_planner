import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import { extractJsonFromText, parseAndHealStudyContent } from "./aiParser";
import { executeWithSingleRetry } from "./aiRetry";

export { extractJsonFromText, parseAndHealStudyContent };

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
    prompt += buildRefinementPromptSection(refinementPrompt, existingSet);
  }

  const responseSchema = buildGeminiResponseSchema(mode);

  return executeWithSingleRetry(
    async (attempt) => {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature: attempt === 0 ? 0.3 : 0.2,
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
        const emptyErr = new Error(
          "Gemini returned an empty response. The input material might be unclear or empty."
        );
        emptyErr.code = "MALFORMED_AI_OUTPUT";
        throw emptyErr;
      }

      return parseAndHealStudyContent(rawOutput, mode);
    },
    {
      signal,
      onRetry: (normalized, attemptNum) => {
        console.warn(
          `Retrying Gemini study generation after transient/schema issue (attempt ${attemptNum}):`,
          normalized.message
        );
      },
    }
  );
}

function buildRefinementPromptSection(refinementPrompt, existingSet) {
  const flashcards = Array.isArray(existingSet.flashcards) ? existingSet.flashcards.slice(0, 20) : [];
  const quiz = Array.isArray(existingSet.quiz) ? existingSet.quiz.slice(0, 20) : [];

  const serializedCards = flashcards.length
    ? flashcards
        .map((c, idx) => `${idx + 1}. Front: ${c.front}\n   Back: ${c.back}`)
        .join("\n")
    : "(none)";

  const serializedQuiz = quiz.length
    ? quiz
        .map(
          (q, idx) =>
            `${idx + 1}. Question: ${q.question}\n   Options: ${JSON.stringify(q.options)}\n   Correct Index: ${q.correctAnswerIndex}\n   Explanation: ${q.explanation}`
        )
        .join("\n")
    : "(none)";

  const summaryBlock = existingSet.summary ? `\nCurrent Summary: ${existingSet.summary}` : "";
  const topicBlock = existingSet.topic ? `\nCurrent Topic: ${existingSet.topic}` : "";

  return `\nREFINEMENT INSTRUCTION:
The user has an existing study set and wants to refine it in place while preserving unchanged strong items unless requested otherwise:
User request: "${refinementPrompt}"
Current Title: ${existingSet.title || "Untitled"}${topicBlock}${summaryBlock}

EXISTING FLASHCARDS (${flashcards.length}):
${serializedCards}

EXISTING QUIZ QUESTIONS (${quiz.length}):
${serializedQuiz}

Apply the requested edits, expansions, difficulty adjustments, or corrections cleanly across this existing study set.`;
}

