import { z } from "zod";

export const FlashcardSchema = z.object({
  id: z.string().optional(),
  front: z.string().min(1, "Front text cannot be empty").trim(),
  back: z.string().min(1, "Back text cannot be empty").trim(),
});

export const QuizQuestionSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1, "Question cannot be empty").trim(),
  options: z
    .array(z.string().min(1, "Option text cannot be empty").trim())
    .length(4, "Each question must have exactly 4 options"),
  correctAnswerIndex: z
    .number()
    .int()
    .min(0)
    .max(3, "Correct answer index must be between 0 and 3"),
  explanation: z.string().min(1, "Explanation cannot be empty").trim(),
});

export const ChecklistItemSchema = z.object({
  id: z.string().optional(),
  task: z.string().min(1, "Task cannot be empty").trim(),
  completed: z.boolean().default(false),
  orderIndex: z.number().int().optional(),
});

export const GenerationRequestSchema = z.object({
  text: z
    .string()
    .trim()
    .min(2, "Source notes or topic must be at least 2 characters long")
    .max(100000, "Input exceeds maximum allowed size of 100,000 characters"),
  mode: z.enum(["flashcards", "quiz", "both"]).default("both"),
  title: z.string().optional(),
  targetCount: z.number().int().min(1).max(20).optional().default(6),
  refinementPrompt: z.string().max(1000).optional(),
  existingSet: z
    .object({
      title: z.string().optional(),
      flashcards: z.array(FlashcardSchema).optional(),
      quiz: z.array(QuizQuestionSchema).optional(),
    })
    .optional(),
});

export const GeneratedContentSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  topic: z.string().optional().default("General"),
  summary: z.string().optional(),
  mode: z.enum(["flashcards", "quiz", "both"]),
  flashcards: z.array(FlashcardSchema).default([]),
  quiz: z.array(QuizQuestionSchema).default([]),
  checklist: z.array(ChecklistItemSchema).optional().default([]),
});

export const StudySetSaveSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  topic: z.string().optional().default("General"),
  sourceType: z.enum(["text", "pdf"]).default("text"),
  sourcePreview: z.string().optional().default(""),
  mode: z.enum(["flashcards", "quiz", "both"]),
  flashcards: z.array(FlashcardSchema).default([]),
  quiz: z.array(QuizQuestionSchema).default([]),
  checklist: z.array(ChecklistItemSchema).optional().default([]),
});

export const ProgressUpdateSchema = z.object({
  cardIndex: z.number().int().min(0, "Card index must be non-negative"),
  status: z.enum(["unseen", "learning", "mastered"]),
});

export const QuizAttemptSchema = z.object({
  score: z.number().int().min(0),
  totalQuestions: z.number().int().min(1),
  answers: z.array(
    z.object({
      questionIndex: z.number().int().min(0),
      selectedOptionIndex: z.number().int().min(0).max(3),
      isCorrect: z.boolean(),
    })
  ),
});

export const ChecklistCreateSchema = z.object({
  task: z.string().min(1, "Task cannot be empty").trim(),
  studySetId: z.string().uuid().optional().nullable(),
  orderIndex: z.number().int().optional().default(0),
});

export const ChecklistUpdateSchema = z.object({
  completed: z.boolean().optional(),
  task: z.string().min(1).optional(),
  orderIndex: z.number().int().optional(),
});

