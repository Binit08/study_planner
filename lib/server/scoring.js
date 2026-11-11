import "server-only";

/**
 * Calculates quiz score, correctness flags, and returns a rich score summary
 * @param {Array<{ question: string, options: string[], correctAnswerIndex: number, explanation: string }>} quizQuestions
 * @param {Array<{ questionIndex: number, selectedOptionIndex: number }>} submittedAnswers
 */
export function scoreQuizSubmission(quizQuestions = [], submittedAnswers = []) {
  if (!Array.isArray(quizQuestions) || quizQuestions.length === 0) {
    throw new Error("No quiz questions provided for scoring");
  }

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

/**
 * Calculates overall study set progress metrics
 */
export function calculateStudyMetrics(studySet, cardProgressList = [], quizAttempts = []) {
  const totalCards = Array.isArray(studySet?.flashcards) ? studySet.flashcards.length : 0;
  const totalQuestions = Array.isArray(studySet?.quiz) ? studySet.quiz.length : 0;

  let masteredCount = 0;
  let learningCount = 0;
  let unseenCount = 0;

  const progressMap = new Map();
  cardProgressList.forEach((p) => {
    progressMap.set(p.card_index ?? p.cardIndex, p.status);
  });

  for (let i = 0; i < totalCards; i++) {
    const status = progressMap.get(i) || "unseen";
    if (status === "mastered") masteredCount++;
    else if (status === "learning") learningCount++;
    else unseenCount++;
  }

  const cardMasteryPercentage =
    totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

  let bestQuizScore = null;
  let latestQuizScore = null;

  if (quizAttempts.length > 0) {
    const sorted = [...quizAttempts].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
    const scores = sorted.map((a) => Math.round((a.score / a.total_questions) * 100));
    bestQuizScore = Math.max(...scores);
    latestQuizScore = scores[0];
  }

  return {
    totalCards,
    totalQuestions,
    masteredCount,
    learningCount,
    unseenCount,
    cardMasteryPercentage,
    attemptsCount: quizAttempts.length,
    bestQuizScore,
    latestQuizScore,
  };
}
