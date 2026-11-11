import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createLocalStoreRepository } from "../lib/server/localStore.js";

describe("Local Store Repository Persistence", () => {
  let tmpDir;
  let storeFile;
  let repo;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "flam-store-test-"));
    storeFile = path.join(tmpDir, "study_store.json");
    repo = createLocalStoreRepository(storeFile);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("creates study set with checklist and returns attached progress/attempt stats", () => {
    const created = repo.createStudySet({
      title: "Graph Algorithms",
      topic: "CS",
      mode: "both",
      flashcards: [
        { front: "BFS queue?", back: "FIFO" },
        { front: "DFS stack?", back: "LIFO" },
      ],
      quiz: [
        {
          question: "Which traversal finds shortest unweighted path?",
          options: ["DFS", "BFS", "Prim", "Kruskal"],
          correctAnswerIndex: 1,
          explanation: "BFS explores level by level.",
        },
      ],
      checklist: [{ task: "Revise BFS vs DFS" }],
    });

    assert.ok(created.id);
    assert.strictEqual(created.checklist.length, 1);

    repo.updateFlashcardProgress(created.id, 0, "mastered");
    repo.recordQuizAttempt(created.id, {
      score: 1,
      totalQuestions: 1,
      answers: [{ questionIndex: 0, selectedOptionIndex: 1, isCorrect: true }],
    });

    const all = repo.listStudySets();
    assert.strictEqual(all.length, 1);
    assert.strictEqual(all[0].progress.length, 1);
    assert.strictEqual(all[0].progress[0].status, "mastered");
    assert.strictEqual(all[0].attempts.length, 1);
  });

  test("manages scheduled tasks, overdue rescheduling, goals, and focus sessions", () => {
    const overdue = repo.addChecklistItem({
      task: "Catch up on Chapter 1",
      scheduledDate: "2026-11-01",
      priority: "high",
      estimatedMinutes: 30,
    });
    assert.strictEqual(overdue.completed, false);

    const moved = repo.rescheduleOverdueTasks("2026-11-11");
    assert.strictEqual(moved.length, 1);
    assert.strictEqual(moved[0].scheduled_date, "2026-11-11");

    const updatedTask = repo.updateChecklistItem(overdue.id, { completed: true });
    assert.strictEqual(updatedTask.completed, true);
    assert.ok(updatedTask.completed_at);

    const goal = repo.addStudyGoal({
      title: "Midterm Exam",
      examDate: "2026-11-20",
      dailyMinutes: 40,
    });
    assert.strictEqual(goal.completed, false);
    const doneGoal = repo.updateStudyGoal(goal.id, { completed: true });
    assert.strictEqual(doneGoal.completed, true);

    repo.addStudySession({ durationMinutes: 25, activityType: "focus" });
    const sessions = repo.listStudySessions();
    assert.strictEqual(sessions.length, 1);

    const overview = repo.getPlannerOverview(new Date("2026-11-11T10:00:00.000Z"));
    assert.strictEqual(overview.stats.overdueCount, 0);
    assert.strictEqual(overview.goals.length, 1);
    assert.strictEqual(overview.recentSessions.length, 1);
  });
});

