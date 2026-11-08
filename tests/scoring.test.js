import { test, describe } from "node:test";
import assert from "node:assert";

function scoreQuizSubmission(quizQuestions = [], submittedAnswers = []) {
  const answerMap = new Map();
  submittedAnswers.forEach((ans) => {
    answerMap.set(ans.questionIndex, ans.selectedOptionIndex);
  });

  let correctCount = 0;
  const processedAnswers = [];
  const wrongQuestions = [];

  quizQuestions.forEach((q, idx) => {
    const selected = answerMap.has(idx) ? answerMap.get(idx) : -1;
    const isCorrect = selected === q.correctAnswerIndex;

    if (isCorrect) {
      correctCount += 1;
    } else {
      wrongQuestions.push({
        questionIndex: idx,
        question: q.question,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        selectedOptionIndex: selected,
        explanation: q.explanation,
      });
    }

    processedAnswers.push({
      questionIndex: idx,
      selectedOptionIndex: selected,
      isCorrect,
    });
  });

  const totalQuestions = quizQuestions.length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);

  return {
    score: correctCount,
    totalQuestions,
    percentage,
    passed: percentage >= 70,
    answers: processedAnswers,
    wrongQuestions,
  };
}

describe("Quiz Scoring Engine", () => {
  const sampleQuestions = [
    {
      question: "Q1",
      options: ["A", "B", "C", "D"],
      correctAnswerIndex: 0,
      explanation: "A is correct",
    },
    {
      question: "Q2",
      options: ["A", "B", "C", "D"],
      correctAnswerIndex: 2,
      explanation: "C is correct",
    },
    {
      question: "Q3",
      options: ["A", "B", "C", "D"],
      correctAnswerIndex: 1,
      explanation: "B is correct",
    },
  ];

  test("computes perfect score and passed status correctly", () => {
    const submissions = [
      { questionIndex: 0, selectedOptionIndex: 0 },
      { questionIndex: 1, selectedOptionIndex: 2 },
      { questionIndex: 2, selectedOptionIndex: 1 },
    ];

    const result = scoreQuizSubmission(sampleQuestions, submissions);
    assert.strictEqual(result.score, 3);
    assert.strictEqual(result.totalQuestions, 3);
    assert.strictEqual(result.percentage, 100);
    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.wrongQuestions.length, 0);
  });

  test("extracts wrong questions for targeted re-testing", () => {
    const submissions = [
      { questionIndex: 0, selectedOptionIndex: 0 },
      { questionIndex: 1, selectedOptionIndex: 3 },
      { questionIndex: 2, selectedOptionIndex: 0 },
    ];

    const result = scoreQuizSubmission(sampleQuestions, submissions);
    assert.strictEqual(result.score, 1);
    assert.strictEqual(result.percentage, 33);
    assert.strictEqual(result.passed, false);
    assert.strictEqual(result.wrongQuestions.length, 2);
    assert.strictEqual(result.wrongQuestions[0].questionIndex, 1);
    assert.strictEqual(result.wrongQuestions[1].questionIndex, 2);
  });
});
