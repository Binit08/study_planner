import fs from "fs";
import path from "path";
import crypto from "crypto";
import { calculateNextReview, computePlannerSummary, toDateKey } from "./planner.js";

const DEFAULT_STORE_FILE = path.join(process.cwd(), ".data", "study_store.json");

export function normalizeLocalStore(parsed) {
  return {
    study_sets: Array.isArray(parsed?.study_sets) ? parsed.study_sets : [],
    flashcard_progress: Array.isArray(parsed?.flashcard_progress) ? parsed.flashcard_progress : [],
    quiz_attempts: Array.isArray(parsed?.quiz_attempts) ? parsed.quiz_attempts : [],
    checklist_items: Array.isArray(parsed?.checklist_items) ? parsed.checklist_items : [],
    study_goals: Array.isArray(parsed?.study_goals) ? parsed.study_goals : [],
    study_sessions: Array.isArray(parsed?.study_sessions) ? parsed.study_sessions : [],
  };
}

export function ensureLocalStore(storeFile = DEFAULT_STORE_FILE) {
  const dir = path.dirname(storeFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(storeFile)) {
    const initial = normalizeLocalStore({});
    fs.writeFileSync(storeFile, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
  try {
    const raw = fs.readFileSync(storeFile, "utf8");
    return normalizeLocalStore(JSON.parse(raw));
  } catch {
    return normalizeLocalStore({});
  }
}

export function writeLocalStore(data, storeFile = DEFAULT_STORE_FILE) {
  ensureLocalStore(storeFile);
  fs.writeFileSync(storeFile, JSON.stringify(data, null, 2), "utf8");
}

export function attachSetStats(sets = [], progressRows = [], attemptRows = []) {
  const progressBySet = new Map();
  for (const row of progressRows) {
    if (!progressBySet.has(row.study_set_id)) progressBySet.set(row.study_set_id, []);
    progressBySet.get(row.study_set_id).push(row);
  }

  const attemptsBySet = new Map();
  for (const row of attemptRows) {
    if (!attemptsBySet.has(row.study_set_id)) attemptsBySet.set(row.study_set_id, []);
    attemptsBySet.get(row.study_set_id).push(row);
  }

  return sets.map((set) => ({
    ...set,
    progress: progressBySet.get(set.id) || [],
    attempts: attemptsBySet.get(set.id) || [],
  }));
}

/**
 * Pure field mappers shared by Supabase and local store
 */
export function mapChecklistUpdates(updates) {
  const dbUpdates = {};
  if (updates.task !== undefined) dbUpdates.task = updates.task;
  if (updates.completed !== undefined) {
    dbUpdates.completed = updates.completed;
    dbUpdates.completed_at = updates.completed ? new Date().toISOString() : null;
  }
  if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;
  if (updates.scheduledDate !== undefined) dbUpdates.scheduled_date = updates.scheduledDate;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.estimatedMinutes !== undefined) dbUpdates.estimated_minutes = updates.estimatedMinutes;
  return dbUpdates;
}

export function mapGoalUpdates(updates) {
  const dbUpdates = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.topic !== undefined) dbUpdates.topic = updates.topic;
  if (updates.examDate !== undefined) dbUpdates.exam_date = updates.examDate;
  if (updates.dailyMinutes !== undefined) dbUpdates.daily_minutes = updates.dailyMinutes;
  if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
  return dbUpdates;
}

/**
 * Factory creating local JSON store operations bound to a store file path.
 * Allows isolated unit testing with temporary files while defaulting to .data/study_store.json.
 */
export function createLocalStoreRepository(storeFile = DEFAULT_STORE_FILE) {
  function listStudySets() {
    const store = ensureLocalStore(storeFile);
    const sorted = (store.study_sets || []).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return attachSetStats(sorted, store.flashcard_progress || [], store.quiz_attempts || []);
  }

  function getStudySetById(id) {
    const store = ensureLocalStore(storeFile);
    const set = store.study_sets.find((s) => s.id === id);
    if (!set) return null;

    const progress = store.flashcard_progress.filter((p) => p.study_set_id === id);
    const attempts = store.quiz_attempts
      .filter((a) => a.study_set_id === id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const checklist = store.checklist_items
      .filter((c) => c.study_set_id === id)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    return { ...set, progress, attempts, checklist };
  }

  function createStudySet({
    title,
    topic = "General",
    sourceType = "text",
    sourcePreview = "",
    mode = "both",
    flashcards = [],
    quiz = [],
    checklist = [],
  }) {
    const store = ensureLocalStore(storeFile);
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();

    store.study_sets.push({
      id: newId,
      title,
      topic,
      source_type: sourceType,
      source_preview: sourcePreview.slice(0, 500),
      mode,
      flashcards,
      quiz,
      created_at: now,
      updated_at: now,
    });

    checklist.forEach((item, idx) => {
      store.checklist_items.push({
        id: crypto.randomUUID(),
        study_set_id: newId,
        task: item.task,
        completed: Boolean(item.completed),
        order_index: idx,
        scheduled_date: item.scheduledDate || null,
        due_date: item.dueDate || null,
        priority: item.priority || "medium",
        estimated_minutes: item.estimatedMinutes || 20,
        completed_at: null,
        created_at: now,
        updated_at: now,
      });
    });

    writeLocalStore(store, storeFile);
    return getStudySetById(newId);
  }

  function deleteStudySet(id) {
    const store = ensureLocalStore(storeFile);
    store.study_sets = store.study_sets.filter((s) => s.id !== id);
    store.flashcard_progress = store.flashcard_progress.filter((p) => p.study_set_id !== id);
    store.quiz_attempts = store.quiz_attempts.filter((a) => a.study_set_id !== id);
    store.checklist_items = store.checklist_items.filter((c) => c.study_set_id !== id);
    writeLocalStore(store, storeFile);
    return true;
  }

  function updateFlashcardProgress(studySetId, cardIndex, status) {
    const store = ensureLocalStore(storeFile);
    const now = new Date();
    const nowIso = now.toISOString();
    const existingIndex = store.flashcard_progress.findIndex(
      (p) => p.study_set_id === studySetId && p.card_index === cardIndex
    );

    const existing = existingIndex >= 0 ? store.flashcard_progress[existingIndex] : null;
    const srs = calculateNextReview(existing, status, now);

    if (existingIndex >= 0) {
      store.flashcard_progress[existingIndex] = {
        ...store.flashcard_progress[existingIndex],
        status,
        last_reviewed_at: nowIso,
        updated_at: nowIso,
        ...srs,
      };
    } else {
      store.flashcard_progress.push({
        id: crypto.randomUUID(),
        study_set_id: studySetId,
        card_index: cardIndex,
        status,
        last_reviewed_at: nowIso,
        created_at: nowIso,
        updated_at: nowIso,
        ...srs,
      });
    }

    writeLocalStore(store, storeFile);
    return store.flashcard_progress.find(
      (p) => p.study_set_id === studySetId && p.card_index === cardIndex
    );
  }

  function recordQuizAttempt(studySetId, { score, totalQuestions, answers }) {
    const store = ensureLocalStore(storeFile);
    const newAttempt = {
      id: crypto.randomUUID(),
      study_set_id: studySetId,
      score,
      total_questions: totalQuestions,
      answers,
      created_at: new Date().toISOString(),
    };
    store.quiz_attempts.push(newAttempt);
    writeLocalStore(store, storeFile);
    return newAttempt;
  }

  function listChecklistItems(studySetId = null) {
    const store = ensureLocalStore(storeFile);
    let items = store.checklist_items || [];
    if (studySetId) {
      items = items.filter((c) => c.study_set_id === studySetId);
    }
    return items.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  }

  function addChecklistItem({
    task,
    studySetId = null,
    orderIndex = 0,
    scheduledDate = null,
    dueDate = null,
    priority = "medium",
    estimatedMinutes = 20,
  }) {
    const store = ensureLocalStore(storeFile);
    const now = new Date().toISOString();
    const newItem = {
      id: crypto.randomUUID(),
      task,
      study_set_id: studySetId,
      order_index: orderIndex,
      completed: false,
      scheduled_date: scheduledDate,
      due_date: dueDate,
      priority,
      estimated_minutes: estimatedMinutes,
      completed_at: null,
      created_at: now,
      updated_at: now,
    };
    store.checklist_items.push(newItem);
    writeLocalStore(store, storeFile);
    return newItem;
  }

  function addBulkChecklistItems(items = []) {
    if (!Array.isArray(items) || items.length === 0) return [];
    const store = ensureLocalStore(storeFile);
    const now = new Date().toISOString();
    const created = items.map((item, idx) => {
      const newItem = {
        id: crypto.randomUUID(),
        task: item.task,
        study_set_id: item.study_set_id || null,
        order_index: item.order_index ?? idx,
        completed: false,
        scheduled_date: item.scheduled_date || null,
        due_date: item.due_date || null,
        priority: item.priority || "medium",
        estimated_minutes: item.estimated_minutes || 20,
        completed_at: null,
        created_at: now,
        updated_at: now,
      };
      store.checklist_items.push(newItem);
      return newItem;
    });
    writeLocalStore(store, storeFile);
    return created;
  }

  function updateChecklistItem(id, updates) {
    const store = ensureLocalStore(storeFile);
    const idx = store.checklist_items.findIndex((c) => c.id === id);
    if (idx === -1) return null;

    const dbUpdates = mapChecklistUpdates(updates);
    store.checklist_items[idx] = {
      ...store.checklist_items[idx],
      ...dbUpdates,
      updated_at: new Date().toISOString(),
    };
    writeLocalStore(store, storeFile);
    return store.checklist_items[idx];
  }

  function deleteChecklistItem(id) {
    const store = ensureLocalStore(storeFile);
    store.checklist_items = store.checklist_items.filter((c) => c.id !== id);
    writeLocalStore(store, storeFile);
    return true;
  }

  function rescheduleOverdueTasks(todayStr = toDateKey()) {
    const store = ensureLocalStore(storeFile);
    const now = new Date().toISOString();
    const moved = [];
    store.checklist_items = store.checklist_items.map((item) => {
      if (!item.completed && item.scheduled_date && item.scheduled_date < todayStr) {
        const updated = { ...item, scheduled_date: todayStr, updated_at: now };
        moved.push(updated);
        return updated;
      }
      return item;
    });
    writeLocalStore(store, storeFile);
    return moved;
  }

  function listStudyGoals() {
    const store = ensureLocalStore(storeFile);
    return (store.study_goals || []).sort((a, b) => a.exam_date.localeCompare(b.exam_date));
  }

  function getStudyGoalById(id) {
    const store = ensureLocalStore(storeFile);
    return store.study_goals.find((g) => g.id === id) || null;
  }

  function addStudyGoal({
    title,
    topic = "General",
    studySetId = null,
    examDate,
    dailyMinutes = 30,
  }) {
    const store = ensureLocalStore(storeFile);
    const now = new Date().toISOString();
    const newGoal = {
      id: crypto.randomUUID(),
      title,
      topic,
      study_set_id: studySetId,
      exam_date: examDate,
      daily_minutes: dailyMinutes,
      completed: false,
      created_at: now,
      updated_at: now,
    };
    store.study_goals.push(newGoal);
    writeLocalStore(store, storeFile);
    return newGoal;
  }

  function updateStudyGoal(id, updates) {
    const store = ensureLocalStore(storeFile);
    const idx = store.study_goals.findIndex((g) => g.id === id);
    if (idx === -1) return null;

    const dbUpdates = mapGoalUpdates(updates);
    store.study_goals[idx] = {
      ...store.study_goals[idx],
      ...dbUpdates,
      updated_at: new Date().toISOString(),
    };
    writeLocalStore(store, storeFile);
    return store.study_goals[idx];
  }

  function deleteStudyGoal(id) {
    const store = ensureLocalStore(storeFile);
    store.study_goals = store.study_goals.filter((g) => g.id !== id);
    writeLocalStore(store, storeFile);
    return true;
  }

  function listStudySessions() {
    const store = ensureLocalStore(storeFile);
    return (store.study_sessions || []).sort(
      (a, b) =>
        new Date(b.completed_at || b.created_at).getTime() -
        new Date(a.completed_at || a.created_at).getTime()
    );
  }

  function addStudySession({
    studySetId = null,
    topic = "General",
    durationMinutes,
    activityType = "focus",
  }) {
    const store = ensureLocalStore(storeFile);
    const nowIso = new Date().toISOString();
    const session = {
      id: crypto.randomUUID(),
      study_set_id: studySetId,
      topic,
      duration_minutes: durationMinutes,
      activity_type: activityType,
      completed_at: nowIso,
      created_at: nowIso,
    };
    store.study_sessions.push(session);
    writeLocalStore(store, storeFile);
    return session;
  }

  function getPlannerOverview(now = new Date()) {
    const store = ensureLocalStore(storeFile);
    return computePlannerSummary({
      studySets: store.study_sets || [],
      progressRows: store.flashcard_progress || [],
      quizAttempts: store.quiz_attempts || [],
      checklistItems: store.checklist_items || [],
      goals: store.study_goals || [],
      sessions: store.study_sessions || [],
      now,
    });
  }

  return {
    listStudySets,
    getStudySetById,
    createStudySet,
    deleteStudySet,
    updateFlashcardProgress,
    recordQuizAttempt,
    listChecklistItems,
    addChecklistItem,
    addBulkChecklistItems,
    updateChecklistItem,
    deleteChecklistItem,
    rescheduleOverdueTasks,
    listStudyGoals,
    getStudyGoalById,
    addStudyGoal,
    updateStudyGoal,
    deleteStudyGoal,
    listStudySessions,
    addStudySession,
    getPlannerOverview,
  };
}

export const defaultLocalRepo = createLocalStoreRepository();

