/**
 * Pure Study Planner, Spaced Repetition (SM-2), Streak & Schedule helpers.
 * Intentionally side-effect free so both Next.js server routes and unit tests can import it.
 */

export function toDateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDaysToDateKey(dateKey, days) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  const year = utc.getUTCFullYear();
  const month = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const day = String(utc.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function diffDaysBetweenKeys(fromKey, toKey) {
  const [fy, fm, fd] = fromKey.split("-").map(Number);
  const [ty, tm, td] = toKey.split("-").map(Number);
  const fromUtc = Date.UTC(fy, fm - 1, fd);
  const toUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((toUtc - fromUtc) / 86400000);
}

/**
 * SM-2-inspired spaced repetition interval calculation
 */
export function calculateNextReview(currentProgress, status, now = new Date()) {
  const prevEase = Number(currentProgress?.ease_factor ?? 2.5);
  const prevInterval = Number(currentProgress?.interval_days ?? 0);
  const prevReps = Number(currentProgress?.repetitions ?? 0);

  if (status === "unseen") {
    return {
      ease_factor: 2.5,
      interval_days: 0,
      repetitions: 0,
      next_review_at: null,
    };
  }

  if (status === "learning") {
    const nextDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return {
      ease_factor: Math.max(1.3, Number((prevEase - 0.2).toFixed(2))),
      interval_days: 1,
      repetitions: 0,
      next_review_at: nextDate.toISOString(),
    };
  }

  // status === "mastered"
  const repetitions = prevReps + 1;
  let intervalDays = 1;
  if (prevReps === 0) {
    intervalDays = 1;
  } else if (prevReps === 1) {
    intervalDays = 6;
  } else {
    intervalDays = Math.max(1, Math.round(prevInterval * prevEase));
  }

  const easeFactor = Number(Math.min(3.0, prevEase + 0.1).toFixed(2));
  const nextDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return {
    ease_factor: easeFactor,
    interval_days: intervalDays,
    repetitions,
    next_review_at: nextDate.toISOString(),
  };
}

/**
 * Returns true if a previously studied card is due for review today or earlier
 */
export function isCardDue(progressRow, now = new Date()) {
  if (!progressRow || progressRow.status === "unseen" || !progressRow.next_review_at) {
    return false;
  }
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  return new Date(progressRow.next_review_at).getTime() <= endOfToday.getTime();
}

/**
 * Computes consecutive active study days up to today (or yesterday if nothing logged today yet)
 */
export function computeStudyStreak(sessions = [], checklistItems = [], todayStr = toDateKey()) {
  const activeDates = new Set();

  for (const s of sessions) {
    const raw = s?.completed_at || s?.created_at;
    if (raw) activeDates.add(String(raw).slice(0, 10));
  }

  for (const item of checklistItems) {
    if (item?.completed && item?.completed_at) {
      activeDates.add(String(item.completed_at).slice(0, 10));
    }
  }

  if (activeDates.size === 0) return 0;

  let cursor = todayStr;
  if (!activeDates.has(cursor)) {
    const yesterday = addDaysToDateKey(todayStr, -1);
    if (!activeDates.has(yesterday)) {
      return 0;
    }
    cursor = yesterday;
  }

  let streak = 0;
  while (activeDates.has(cursor)) {
    streak += 1;
    cursor = addDaysToDateKey(cursor, -1);
  }
  return streak;
}

/**
 * Generates a balanced day-by-day checklist schedule up to an exam/goal date
 */
export function buildExamSchedule({ goal, studySet = null, todayStr = toDateKey() }) {
  const daysLeft = diffDaysBetweenKeys(todayStr, goal.exam_date);
  const dailyMins = Number(goal.daily_minutes || 30);
  const label = studySet?.title || goal.title;
  const hasCards = Array.isArray(studySet?.flashcards) && studySet.flashcards.length > 0;
  const hasQuiz = Array.isArray(studySet?.quiz) && studySet.quiz.length > 0;

  const templateTasks = [
    {
      task: `${label}: Core concept review & notes summary`,
      priority: "high",
      estimated_minutes: Math.min(dailyMins, 30),
    },
    ...(hasCards
      ? [
          {
            task: `${label}: First-pass flashcard drill (all ${studySet.flashcards.length} cards)`,
            priority: "high",
            estimated_minutes: Math.min(dailyMins, 25),
          },
        ]
      : []),
    ...(hasQuiz
      ? [
          {
            task: `${label}: Practice quiz & review explanations`,
            priority: "medium",
            estimated_minutes: Math.min(dailyMins, 25),
          },
        ]
      : []),
    ...(hasCards
      ? [
          {
            task: `${label}: Spaced review of 'Needs Review' flashcards`,
            priority: "medium",
            estimated_minutes: Math.min(dailyMins, 20),
          },
        ]
      : []),
    ...(hasQuiz
      ? [
          {
            task: `${label}: Re-test mistakes until 90%+ mastery`,
            priority: "high",
            estimated_minutes: Math.min(dailyMins, 25),
          },
        ]
      : []),
    {
      task: `${label}: Final pre-exam recap & confidence check`,
      priority: "high",
      estimated_minutes: Math.min(dailyMins, 30),
    },
  ];

  // Fallback if no cards/quiz linked
  if (templateTasks.length < 3) {
    templateTasks.splice(
      1,
      0,
      {
        task: `${label}: Active recall practice problems`,
        priority: "medium",
        estimated_minutes: Math.min(dailyMins, 25),
      },
      {
        task: `${label}: Weak-area review & self-testing`,
        priority: "medium",
        estimated_minutes: Math.min(dailyMins, 25),
      }
    );
  }

  if (daysLeft <= 0) {
    return templateTasks.slice(0, 2).map((t, idx) => ({
      ...t,
      study_set_id: goal.study_set_id || null,
      scheduled_date: todayStr,
      due_date: goal.exam_date,
      order_index: idx,
    }));
  }

  const totalSteps = templateTasks.length;
  const spanDays = Math.max(1, daysLeft);

  return templateTasks.map((t, idx) => {
    const offset =
      totalSteps === 1
        ? 0
        : Math.min(spanDays, Math.round((idx * Math.max(0, spanDays - 1)) / (totalSteps - 1)));
    const scheduledDate = addDaysToDateKey(todayStr, offset);

    return {
      ...t,
      study_set_id: goal.study_set_id || null,
      scheduled_date: scheduledDate,
      due_date: goal.exam_date,
      order_index: idx,
    };
  });
}

/**
 * Aggregates everything needed by the /planner dashboard
 */
export function computePlannerSummary({
  studySets = [],
  progressRows = [],
  quizAttempts = [],
  checklistItems = [],
  goals = [],
  sessions = [],
  now = new Date(),
}) {
  const todayStr = toDateKey(now);
  const weekStartStr = addDaysToDateKey(todayStr, -6);

  const setMap = new Map(studySets.map((s) => [s.id, s]));

  // Enrich checklist items with linked study set metadata
  const enrichedTasks = checklistItems.map((item) => {
    const linked = item.study_set_id ? setMap.get(item.study_set_id) : null;
    return {
      ...item,
      study_set_title: linked?.title || null,
      study_set_topic: linked?.topic || null,
    };
  });

  const overdueTasks = enrichedTasks.filter(
    (t) => !t.completed && t.scheduled_date && t.scheduled_date < todayStr
  );
  const todayTasks = enrichedTasks.filter((t) => t.scheduled_date === todayStr);
  const upcomingTasks = enrichedTasks.filter(
    (t) => t.scheduled_date && t.scheduled_date > todayStr
  );
  const unscheduledTasks = enrichedTasks.filter((t) => !t.scheduled_date && !t.completed);

  // Group progress rows by study_set_id
  const progressBySet = new Map();
  for (const row of progressRows) {
    if (!progressBySet.has(row.study_set_id)) {
      progressBySet.set(row.study_set_id, []);
    }
    progressBySet.get(row.study_set_id).push(row);
  }

  // Group quiz attempts by study_set_id (sorted newest first assumed or sort here)
  const attemptsBySet = new Map();
  for (const att of quizAttempts) {
    if (!attemptsBySet.has(att.study_set_id)) {
      attemptsBySet.set(att.study_set_id, []);
    }
    attemptsBySet.get(att.study_set_id).push(att);
  }

  const dueDecks = [];
  const weakSets = [];
  let totalDueCards = 0;

  for (const set of studySets) {
    const cards = Array.isArray(set.flashcards) ? set.flashcards : [];
    const setProgress = progressBySet.get(set.id) || [];
    const progressByIdx = new Map(setProgress.map((p) => [p.card_index, p]));

    let dueCount = 0;
    let learningCount = 0;
    let masteredCount = 0;
    let unseenCount = 0;

    for (let i = 0; i < cards.length; i++) {
      const row = progressByIdx.get(i);
      const status = row?.status || "unseen";
      if (status === "mastered") masteredCount++;
      else if (status === "learning") learningCount++;
      else unseenCount++;

      if (isCardDue(row, now)) {
        dueCount++;
      }
    }

    if (cards.length > 0 && (dueCount > 0 || learningCount > 0)) {
      totalDueCards += dueCount;
      dueDecks.push({
        id: set.id,
        title: set.title,
        topic: set.topic || "General",
        totalCards: cards.length,
        dueCount,
        learningCount,
        masteredCount,
        unseenCount,
      });
    }

    // Weak set detection: latest quiz < 70% OR cards not started/low mastery (< 50%)
    const setAttempts = (attemptsBySet.get(set.id) || []).sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
    const latestAttempt = setAttempts[0] || null;
    const latestQuizPct =
      latestAttempt && latestAttempt.total_questions > 0
        ? Math.round((latestAttempt.score / latestAttempt.total_questions) * 100)
        : null;
    const masteryPct = cards.length > 0 ? Math.round((masteredCount / cards.length) * 100) : null;

    const reasons = [];
    if (latestQuizPct !== null && latestQuizPct < 70) {
      reasons.push(`Latest quiz ${latestQuizPct}%`);
    }
    if (learningCount > 0) {
      reasons.push(`${learningCount} cards need review`);
    } else if (cards.length > 0 && masteryPct < 50 && unseenCount === cards.length) {
      reasons.push("Not started yet");
    }

    if (reasons.length > 0) {
      weakSets.push({
        id: set.id,
        title: set.title,
        topic: set.topic || "General",
        latestQuizPct,
        masteryPct,
        reasons,
      });
    }
  }

  // Enrich goals with daysLeft and readinessPct
  const goalsWithReadiness = goals.map((goal) => {
    const daysLeft = diffDaysBetweenKeys(todayStr, goal.exam_date);
    let readinessPct = 0;

    if (goal.study_set_id && setMap.has(goal.study_set_id)) {
      const set = setMap.get(goal.study_set_id);
      const cards = Array.isArray(set.flashcards) ? set.flashcards : [];
      const setProgress = progressBySet.get(set.id) || [];
      const mastered = setProgress.filter((p) => p.status === "mastered").length;
      const cardScore = cards.length > 0 ? (mastered / cards.length) * 100 : null;

      const setAttempts = attemptsBySet.get(set.id) || [];
      const bestQuiz =
        setAttempts.length > 0
          ? Math.max(
              ...setAttempts.map((a) =>
                a.total_questions > 0 ? Math.round((a.score / a.total_questions) * 100) : 0
              )
            )
          : null;

      const linkedTasks = checklistItems.filter((c) => c.study_set_id === set.id);
      const taskScore =
        linkedTasks.length > 0
          ? (linkedTasks.filter((c) => c.completed).length / linkedTasks.length) * 100
          : null;

      const parts = [cardScore, bestQuiz, taskScore].filter((v) => v !== null);
      readinessPct =
        parts.length > 0 ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;
    } else {
      const topicTasks = checklistItems.filter(
        (c) => c.due_date === goal.exam_date || (goal.topic && c.task?.toLowerCase().includes(goal.topic.toLowerCase()))
      );
      readinessPct =
        topicTasks.length > 0
          ? Math.round((topicTasks.filter((c) => c.completed).length / topicTasks.length) * 100)
          : 0;
    }

    return {
      ...goal,
      study_set_title: goal.study_set_id ? setMap.get(goal.study_set_id)?.title || null : null,
      daysLeft,
      readinessPct,
    };
  });

  // Minutes studied today and past 7 days
  let minutesToday = 0;
  let minutesWeek = 0;
  for (const s of sessions) {
    const mins = Number(s.duration_minutes || 0);
    const dateKey = String(s.completed_at || s.created_at || "").slice(0, 10);
    if (dateKey === todayStr) minutesToday += mins;
    if (dateKey >= weekStartStr && dateKey <= todayStr) minutesWeek += mins;
  }

  const streak = computeStudyStreak(sessions, checklistItems, todayStr);

  return {
    todayStr,
    stats: {
      todayDone: todayTasks.filter((t) => t.completed).length,
      todayTotal: todayTasks.length,
      overdueCount: overdueTasks.length,
      totalDueCards,
      streak,
      minutesToday,
      minutesWeek,
    },
    overdueTasks,
    todayTasks,
    upcomingTasks,
    unscheduledTasks,
    allTasks: enrichedTasks,
    dueDecks: dueDecks.sort((a, b) => b.dueCount - a.dueCount || b.learningCount - a.learningCount),
    weakSets: weakSets.slice(0, 5),
    goals: goalsWithReadiness.sort((a, b) => a.exam_date.localeCompare(b.exam_date)),
    recentSessions: sessions.slice(0, 8),
  };
}

