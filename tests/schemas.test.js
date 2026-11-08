import { test, describe } from "node:test";
import assert from "node:assert";
import { z } from "zod";

const FlashcardSchema = z.object({
  id: z.string().optional(),
  front: z.string().min(1).trim(),
  back: z.string().min(1).trim(),
});

const QuizQuestionSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1).trim(),
  options: z.array(z.string().min(1).trim()).length(4),
  correctAnswerIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1).trim(),
});

describe("Zod Runtime Schemas", () => {
  test("FlashcardSchema passes for valid card", () => {
    const valid = {
      front: "What is the CAP Theorem?",
      back: "Consistency, Availability, and Partition Tolerance.",
    };
    const res = FlashcardSchema.safeParse(valid);
    assert.strictEqual(res.success, true);
  });

  test("FlashcardSchema fails for empty front or back", () => {
    const invalid = { front: "", back: "   " };
    const res = FlashcardSchema.safeParse(invalid);
    assert.strictEqual(res.success, false);
  });

  test("QuizQuestionSchema enforces exactly 4 options and valid answer index", () => {
    const valid = {
      question: "Which data structure uses LIFO?",
      options: ["Queue", "Stack", "Heap", "Tree"],
      correctAnswerIndex: 1,
      explanation: "A stack is a Last-In, First-Out structure.",
    };
    const res = QuizQuestionSchema.safeParse(valid);
    assert.strictEqual(res.success, true);
  });

  test("QuizQuestionSchema fails if less than 4 options or index out of range", () => {
    const invalid = {
      question: "Sample Question?",
      options: ["A", "B", "C"],
      correctAnswerIndex: 4,
      explanation: "Expl",
    };
    const res = QuizQuestionSchema.safeParse(invalid);
    assert.strictEqual(res.success, false);
  });
});
