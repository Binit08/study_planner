import { test, describe } from "node:test";
import assert from "node:assert";

function extractJsonFromText(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Received empty or non-string response");
  }

  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed);
  } catch (e) {}

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (e) {}
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {
      throw new Error("Failed to parse JSON: " + e.message);
    }
  }

  throw new Error("No valid JSON structure found in AI response");
}

describe("AI JSON Resilience & Parser", () => {
  test("parses clean JSON", () => {
    const raw = '{"title":"Operating Systems","mode":"flashcards"}';
    const parsed = extractJsonFromText(raw);
    assert.strictEqual(parsed.title, "Operating Systems");
  });

  test("extracts JSON wrapped in markdown code fences", () => {
    const raw = "```json\n{\n  \"title\": \"Distributed Systems\"\n}\n```";
    const parsed = extractJsonFromText(raw);
    assert.strictEqual(parsed.title, "Distributed Systems");
  });

  test("extracts JSON surrounded by preamble and postamble text", () => {
    const raw = "Here is your requested study set:\n\n{\"title\": \"Cell Biology\", \"quiz\": []}\n\nHope this helps!";
    const parsed = extractJsonFromText(raw);
    assert.strictEqual(parsed.title, "Cell Biology");
  });

  test("throws error when no valid JSON is present", () => {
    assert.throws(() => {
      extractJsonFromText("I am sorry, but I cannot fulfill this request.");
    }, /No valid JSON structure/);
  });
});
