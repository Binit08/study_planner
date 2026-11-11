import { test, describe } from "node:test";
import assert from "node:assert";
import {
  buildAnkiCsv,
  buildAnkiFilename,
  buildStudySetMarkdown,
} from "../lib/exportStudySet.js";

describe("Study Set Exporters", () => {
  test("buildAnkiCsv escapes quotes and includes Anki directives", () => {
    const csv = buildAnkiCsv([
      { front: 'Define "CAP"', back: "Consistency, Availability, Partition tolerance" },
    ]);

    assert.ok(csv.startsWith("#separator:comma\n#html:false\n"));
    assert.ok(csv.includes('"Define ""CAP""","Consistency, Availability, Partition tolerance"'));
    assert.strictEqual(buildAnkiFilename("OS & Concurrency!"), "os---concurrency--anki.csv");
  });

  test("buildStudySetMarkdown formats flashcards, quiz answers, and checklist", () => {
    const md = buildStudySetMarkdown({
      title: "Algorithms",
      topic: "CS",
      summary: "Core sorting and traversal patterns.",
      flashcards: [{ front: "Merge sort complexity?", back: "O(n log n)" }],
      quiz: [
        {
          question: "Which uses a FIFO queue?",
          options: ["BFS", "DFS", "Quicksort", "Prim"],
          correctAnswerIndex: 0,
          explanation: "Breadth-first traversal processes nodes in queue order.",
        },
      ],
      checklist: [{ task: "Implement BFS", completed: true }],
    });

    assert.ok(md.includes("# Algorithms"));
    assert.ok(md.includes("> Core sorting and traversal patterns."));
    assert.ok(md.includes("- [x] BFS *(Correct)*"));
    assert.ok(md.includes("- [x] Implement BFS"));
  });
});

