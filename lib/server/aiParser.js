import { GeneratedContentSchema } from "../schemas/studySet.js";

/**
 * Normalizes and extracts clean JSON from LLM text output
 * even if surrounded by markdown code fences, comments, or leading/trailing text.
 */
export function extractJsonFromText(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Received empty or non-string response from Gemini");
  }

  const trimmed = rawText.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue to code-fence extraction
  }

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Continue to bracket search
    }
  }

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

function healQuizQuestion(q) {
  if (!q || typeof q.question !== "string" || !q.question.trim()) {
    return null;
  }
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    return null;
  }

  const options = q.options.map((opt) => (typeof opt === "string" ? opt.trim() : ""));
  if (options.some((opt) => opt.length === 0)) {
    return null;
  }

  const distinctOptions = new Set(options.map((opt) => opt.toLowerCase()));
  if (distinctOptions.size !== 4) {
    return null;
  }

  if (
    !Number.isInteger(q.correctAnswerIndex) ||
    q.correctAnswerIndex < 0 ||
    q.correctAnswerIndex > 3
  ) {
    return null;
  }

  const explanation =
    typeof q.explanation === "string" && q.explanation.trim().length > 0
      ? q.explanation.trim()
      : "Review the underlying concept for this question.";

  return {
    question: q.question.trim(),
    options,
    correctAnswerIndex: q.correctAnswerIndex,
    explanation,
  };
}

function assertRequiredModeItems(data, mode) {
  if ((mode === "flashcards" || mode === "both") && data.flashcards.length === 0) {
    const err = new Error("AI response contained no valid flashcards.");
    err.code = "MALFORMED_AI_OUTPUT";
    throw err;
  }
  if ((mode === "quiz" || mode === "both") && data.quiz.length === 0) {
    const err = new Error("AI response contained no valid 4-option quiz questions.");
    err.code = "MALFORMED_AI_OUTPUT";
    throw err;
  }
}

/**
 * Parses raw LLM text output, validates against GeneratedContentSchema,
 * and drops malformed items instead of fabricating fake options or answer indices.
 */
export function parseAndHealStudyContent(rawOutput, mode = "both") {
  const parsedJson = extractJsonFromText(rawOutput);

  if (!parsedJson || typeof parsedJson !== "object" || Array.isArray(parsedJson)) {
    const err = new Error("AI response was not a valid JSON study-set object.");
    err.code = "MALFORMED_AI_OUTPUT";
    throw err;
  }

  parsedJson.mode = mode;

  const firstPass = GeneratedContentSchema.safeParse(parsedJson);
  if (firstPass.success) {
    assertRequiredModeItems(firstPass.data, mode);
    return firstPass.data;
  }

  const healed = {
    title:
      typeof parsedJson.title === "string" && parsedJson.title.trim()
        ? parsedJson.title.trim()
        : "Generated Study Set",
    topic:
      typeof parsedJson.topic === "string" && parsedJson.topic.trim()
        ? parsedJson.topic.trim()
        : "General Study",
    summary: typeof parsedJson.summary === "string" ? parsedJson.summary.trim() : "",
    mode,
    flashcards: Array.isArray(parsedJson.flashcards)
      ? parsedJson.flashcards
          .filter(
            (c) =>
              c &&
              typeof c.front === "string" &&
              c.front.trim().length > 0 &&
              typeof c.back === "string" &&
              c.back.trim().length > 0
          )
          .map((c) => ({ front: c.front.trim(), back: c.back.trim() }))
      : [],
    quiz: Array.isArray(parsedJson.quiz)
      ? parsedJson.quiz.map(healQuizQuestion).filter(Boolean)
      : [],
    checklist: Array.isArray(parsedJson.checklist)
      ? parsedJson.checklist
          .filter((i) => i && typeof i.task === "string" && i.task.trim().length > 0)
          .map((i) => ({ task: i.task.trim(), completed: false }))
      : [],
  };

  const secondPass = GeneratedContentSchema.safeParse(healed);
  if (secondPass.success) {
    assertRequiredModeItems(secondPass.data, mode);
    return secondPass.data;
  }

  const err = new Error(
    `Generated content could not be normalized into valid study schema: ${firstPass.error.issues
      .map((i) => i.message)
      .join(", ")}`
  );
  err.code = "MALFORMED_AI_OUTPUT";
  throw err;
}

