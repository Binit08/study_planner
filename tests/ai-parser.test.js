import { test, describe } from "node:test";
import assert from "node:assert";
import { extractJsonFromText, parseAndHealStudyContent } from "../lib/server/aiParser.js";

describe("AI JSON Resilience & Parser", () => {
  test("parses clean JSON", () => {
    const raw = '{"title":"Operating Systems","mode":"flashcards"}';
    const parsed = extractJsonFromText(raw);
    assert.strictEqual(parsed.title, "Operating Systems");
  });

  test("extracts JSON wrapped in markdown code fences", () => {
    const raw = '```json\n{\n  "title": "Distributed Systems"\n}\n```';
    const parsed = extractJsonFromText(raw);
    assert.strictEqual(parsed.title, "Distributed Systems");
  });

  test("extracts JSON surrounded by preamble and postamble text", () => {
    const raw =
      'Here is your requested study set:\n\n{"title": "Cell Biology", "quiz": []}\n\nHope this helps!';
    const parsed = extractJsonFromText(raw);
    assert.strictEqual(parsed.title, "Cell Biology");
  });

  test("throws error when no valid JSON is present", () => {
    assert.throws(() => {
      extractJsonFromText("I am sorry, but I cannot fulfill this request.");
    }, /No valid JSON structure/);
  });

  test("parseAndHealStudyContent drops malformed quiz questions instead of fabricating options or indices", () => {
    const raw = JSON.stringify({
      title: "",
      topic: "Algorithms",
      flashcards: [
        { front: "Binary search complexity?", back: "O(log n)" },
        { front: "Broken card", back: "" },
      ],
      quiz: [
        {
          question: "Incomplete options",
          options: ["A", "B"],
          correctAnswerIndex: 0,
          explanation: "Too few options",
        },
        {
          question: "Invalid index",
          options: ["A", "B", "C", "D"],
          correctAnswerIndex: 9,
          explanation: "Out of bounds",
        },
        {
          question: "Duplicate options",
          options: ["Same", "same ", "C", "D"],
          correctAnswerIndex: 0,
          explanation: "Duplicate distractors should be dropped",
        },
        {
          question: "What is BFS?",
          options: ["Queue traversal", "Stack traversal", "Heap sort", "Hash join"],
          correctAnswerIndex: 0,
          explanation: "BFS explores level by level using a FIFO queue.",
        },
      ],
    });

    const parsed = parseAndHealStudyContent(raw, "both");
    assert.strictEqual(parsed.title, "Generated Study Set");
    assert.strictEqual(parsed.flashcards.length, 1);
    assert.strictEqual(parsed.quiz.length, 1);
    assert.strictEqual(parsed.quiz[0].question, "What is BFS?");
    assert.strictEqual(parsed.quiz[0].options.length, 4);
    assert.strictEqual(parsed.quiz[0].correctAnswerIndex, 0);
  });

  test("parseAndHealStudyContent rejects when no valid items remain for requested mode", () => {
    const raw = JSON.stringify({
      title: "Broken Quiz",
      flashcards: [],
      quiz: [
        {
          question: "Only 2 options",
          options: ["Yes", "No"],
          correctAnswerIndex: 0,
        },
      ],
    });

    assert.throws(() => {
      parseAndHealStudyContent(raw, "quiz");
    }, /no valid 4-option quiz questions/i);
  });
});
