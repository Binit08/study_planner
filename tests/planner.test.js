import { test, describe } from "node:test";
import assert from "node:assert";
import {
  calculateNextReview,
  isCardDue,
  computeStudyStreak,
  buildExamSchedule,
  computePlannerSummary,
} from "../lib/server/planner.js";

describe("Study Planner & SM-2 Spaced Repetition", () => {
  test("calculateNextReview scales intervals on mastered and resets on learning", () => {
    const now = new Date("2026-11-11T10:00:00.000Z");

    const rep1 = calculateNextReview(null, "mastered", now);
    assert.strictEqual(rep1.repetitions, 1);
    assert.strictEqual(rep1.interval_days, 1);
    assert.ok(rep1.next_review_at);

    const rep2 = calculateNextReview(rep1, "mastered", now);
    assert.strictEqual(rep2.repetitions, 2);
    assert.strictEqual(rep2.interval_days, 6);

    const rep3 = calculateNextReview(rep2, "mastered", now);
    assert.strictEqual(rep3.repetitions, 3);
    assert.ok(rep3.interval_days >= 15);

    const lapsed = calculateNextReview(rep3, "learning", now);
    assert.strictEqual(lapsed.repetitions, 0);
    assert.strictEqual(lapsed.interval_days, 1);
    assert.ok(lapsed.ease_factor < rep3.ease_factor);
  });

  test("isCardDue returns true for cards scheduled on or before today, false for future/unseen", () => {
    const now = new Date("2026-11-11T10:00:00.000Z");
    assert.strictEqual(isCardDue(null, now), false);
    assert.strictEqual(isCardDue({ status: "unseen", next_review_at: null }, now), false);
    assert.strictEqual(
      isCardDue({ status: "mastered", next_review_at: "2026-11-11T08:00:00.000Z" }, now),
      true
    );
    assert.strictEqual(
      isCardDue({ status: "mastered", next_review_at: "2026-11-15T10:00:00.000Z" }, now),
      false
    );
  });

  test("computeStudyStreak counts consecutive days from today or yesterday", () => {
    const sessions = [
      { completed_at: "2026-11-10T12:00:00.000Z" },
      { completed_at: "2026-11-09T12:00:00.000Z" },
    ];
    const tasks = [{ completed: true, completed_at: "2026-11-11T09:00:00.000Z" }];

    assert.strictEqual(computeStudyStreak(sessions, tasks, "2026-11-11"), 3);
    assert.strictEqual(computeStudyStreak(sessions, [], "2026-11-11"), 2);
    assert.strictEqual(computeStudyStreak(sessions, [], "2026-11-13"), 0);
  });

  test("buildExamSchedule distributes study milestones up to exam date", () => {
    const goal = {
      id: "g1",
      title: "Algorithms Final",
      exam_date: "2026-11-16",
      daily_minutes: 30,
      study_set_id: "s1",
    };
    const studySet = {
      id: "s1",
      title: "Graph Theory",
      flashcards: [{ front: "BFS?", back: "Queue" }],
      quiz: [{ question: "Q?", options: ["A", "B", "C", "D"], correctAnswerIndex: 0, explanation: "E" }],
    };

    const tasks = buildExamSchedule({ goal, studySet, todayStr: "2026-11-11" });
    assert.ok(tasks.length >= 4);
    assert.strictEqual(tasks[0].scheduled_date, "2026-11-11");
    assert.ok(tasks.every((t) => t.scheduled_date >= "2026-11-11" && t.scheduled_date <= "2026-11-16"));
    assert.ok(tasks.every((t) => t.due_date === "2026-11-16"));
  });

  test("computePlannerSummary aggregates tasks, due decks, weak sets, and goal readiness", () => {
    const now = new Date("2026-11-11T10:00:00.000Z");
    const summary = computePlannerSummary({
      now,
      studySets: [
        {
          id: "s1",
          title: "SQL Joins",
          topic: "Databases",
          flashcards: [
            { front: "A", back: "1" },
            { front: "B", back: "2" },
          ],
          quiz: [{ question: "Q", options: ["1", "2", "3", "4"], correctAnswerIndex: 0, explanation: "E" }],
        },
      ],
      progressRows: [
        { study_set_id: "s1", card_index: 0, status: "mastered", next_review_at: "2026-11-10T10:00:00.000Z" },
        { study_set_id: "s1", card_index: 1, status: "learning", next_review_at: "2026-11-12T10:00:00.000Z" },
      ],
      quizAttempts: [{ study_set_id: "s1", score: 1, total_questions: 2, created_at: "2026-11-11T09:00:00.000Z" }],
      checklistItems: [
        { id: "c1", task: "Old task", completed: false, scheduled_date: "2026-11-10", estimated_minutes: 15 },
        { id: "c2", task: "Today task", completed: true, scheduled_date: "2026-11-11", completed_at: "2026-11-11T09:00:00.000Z", estimated_minutes: 25 },
      ],
      goals: [{ id: "g1", title: "DB Quiz", exam_date: "2026-11-14", study_set_id: "s1", daily_minutes: 30 }],
      sessions: [{ duration_minutes: 25, completed_at: "2026-11-11T09:30:00.000Z" }],
    });

    assert.strictEqual(summary.stats.overdueCount, 1);
    assert.strictEqual(summary.stats.todayDone, 1);
    assert.strictEqual(summary.stats.todayTotal, 1);
    assert.strictEqual(summary.stats.totalDueCards, 1);
    assert.strictEqual(summary.stats.minutesToday, 25);
    assert.strictEqual(summary.stats.streak, 1);
    assert.strictEqual(summary.dueDecks.length, 1);
    assert.strictEqual(summary.weakSets.length, 1);
    assert.strictEqual(summary.goals[0].daysLeft, 3);
    assert.strictEqual(summary.goals[0].readinessPct, 50);
  });
});

