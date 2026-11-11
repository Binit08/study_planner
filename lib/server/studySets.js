import "server-only";
import fs from "fs";
import path from "path";
import { getSupabaseServiceClient, isSupabaseConfigured } from "./supabase";
import { calculateNextReview, computePlannerSummary, toDateKey } from "./planner";

// Local storage fallback for zero-config testing when Supabase env vars are empty
const DATA_DIR = path.join(process.cwd(), ".data");
const LOCAL_STORE_FILE = path.join(DATA_DIR, "study_store.json");

function normalizeLocalStore(parsed) {
  return {
    study_sets: Array.isArray(parsed?.study_sets) ? parsed.study_sets : [],
    flashcard_progress: Array.isArray(parsed?.flashcard_progress) ? parsed.flashcard_progress : [],
    quiz_attempts: Array.isArray(parsed?.quiz_attempts) ? parsed.quiz_attempts : [],
    checklist_items: Array.isArray(parsed?.checklist_items) ? parsed.checklist_items : [],
    study_goals: Array.isArray(parsed?.study_goals) ? parsed.study_goals : [],
    study_sessions: Array.isArray(parsed?.study_sessions) ? parsed.study_sessions : [],
  };
}

function ensureLocalStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_STORE_FILE)) {
    const initial = normalizeLocalStore({});
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
  try {
    const raw = fs.readFileSync(LOCAL_STORE_FILE, "utf8");
    return normalizeLocalStore(JSON.parse(raw));
  } catch {
    return normalizeLocalStore({});
  }
}

function writeLocalStore(data) {
  ensureLocalStore();
  fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(data, null, 2), "utf8");
}

function attachSetStats(sets = [], progressRows = [], attemptRows = []) {
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
 * List all study sets ordered by creation date descending
 */
export async function listStudySets() {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const [setsRes, progressRes, attemptsRes] = await Promise.all([
      supabase
        .from("study_sets")
        .select("id, title, topic, source_type, source_preview, mode, flashcards, quiz, created_at, updated_at")
        .order("created_at", { ascending: false }),
      supabase.from("flashcard_progress").select("study_set_id, status"),
      supabase
        .from("quiz_attempts")
        .select("id, study_set_id, score, total_questions, created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (setsRes.error) {
      throw new Error(`Failed to list study sets from Supabase: ${setsRes.error.message}`);
    }

    return attachSetStats(
      setsRes.data || [],
      progressRes.data || [],
      attemptsRes.data || []
    );
  }

  const store = ensureLocalStore();
  const sorted = (store.study_sets || []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return attachSetStats(sorted, store.flashcard_progress || [], store.quiz_attempts || []);
}

/**
 * Get a specific study set by ID with associated progress, attempts, and checklist
 */
export async function getStudySetById(id) {
  if (!id) throw new Error("Study set ID is required");

  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();

    const [setRes, progressRes, attemptsRes, checklistRes] = await Promise.all([
      supabase.from("study_sets").select("*").eq("id", id).single(),
      supabase.from("flashcard_progress").select("*").eq("study_set_id", id),
      supabase
        .from("quiz_attempts")
        .select("*")
        .eq("study_set_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("checklist_items")
        .select("*")
        .eq("study_set_id", id)
        .order("order_index", { ascending: true }),
    ]);

    if (setRes.error || !setRes.data) {
      return null;
    }

    return {
      ...setRes.data,
      progress: progressRes.data || [],
      attempts: attemptsRes.data || [],
      checklist: checklistRes.data || [],
    };
  }

  const store = ensureLocalStore();
  const set = store.study_sets.find((s) => s.id === id);
  if (!set) return null;

  const progress = store.flashcard_progress.filter((p) => p.study_set_id === id);
  const attempts = store.quiz_attempts
    .filter((a) => a.study_set_id === id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const checklist = store.checklist_items
    .filter((c) => c.study_set_id === id)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  return {
    ...set,
    progress,
    attempts,
    checklist,
  };
}

/**
 * Create a new study set
 */
export async function createStudySet({
  title,
  topic = "General",
  sourceType = "text",
  sourcePreview = "",
  mode = "both",
  flashcards = [],
  quiz = [],
  checklist = [],
}) {
  if (!title) throw new Error("Title is required to save a study set");

  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { data: set, error } = await supabase
      .from("study_sets")
      .insert({
        title,
        topic,
        source_type: sourceType,
        source_preview: sourcePreview.slice(0, 500),
        mode,
        flashcards,
        quiz,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create study set in Supabase: ${error.message}`);
    }

    // Insert checklist items if present
    if (checklist.length > 0) {
      const itemsToInsert = checklist.map((item, idx) => ({
        study_set_id: set.id,
        task: item.task,
        completed: Boolean(item.completed),
        order_index: idx,
        scheduled_date: item.scheduledDate || null,
        due_date: item.dueDate || null,
        priority: item.priority || "medium",
        estimated_minutes: item.estimatedMinutes || 20,
      }));

      await supabase.from("checklist_items").insert(itemsToInsert);
    }

    return getStudySetById(set.id);
  }

  const store = ensureLocalStore();
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  const newSet = {
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
  };

  store.study_sets.push(newSet);

  if (checklist.length > 0) {
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
  }

  writeLocalStore(store);
  return getStudySetById(newId);
}

/**
 * Delete a study set and cascade
 */
export async function deleteStudySet(id) {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { error } = await supabase.from("study_sets").delete().eq("id", id);
    if (error) {
      throw new Error(`Failed to delete study set from Supabase: ${error.message}`);
    }
    return true;
  }

  const store = ensureLocalStore();
  store.study_sets = store.study_sets.filter((s) => s.id !== id);
  store.flashcard_progress = store.flashcard_progress.filter((p) => p.study_set_id !== id);
  store.quiz_attempts = store.quiz_attempts.filter((a) => a.study_set_id !== id);
  store.checklist_items = store.checklist_items.filter((c) => c.study_set_id !== id);
  writeLocalStore(store);
  return true;
}

/**
 * Upsert flashcard progress (unseen, learning, mastered) with SM-2 spaced repetition scheduling
 */
export async function updateFlashcardProgress(studySetId, cardIndex, status) {
  const now = new Date();
  const nowIso = now.toISOString();

  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { data: existing } = await supabase
      .from("flashcard_progress")
      .select("ease_factor, interval_days, repetitions")
      .eq("study_set_id", studySetId)
      .eq("card_index", cardIndex)
      .maybeSingle();

    const srs = calculateNextReview(existing, status, now);

    const { data, error } = await supabase
      .from("flashcard_progress")
      .upsert(
        {
          study_set_id: studySetId,
          card_index: cardIndex,
          status,
          last_reviewed_at: nowIso,
          ease_factor: srs.ease_factor,
          interval_days: srs.interval_days,
          repetitions: srs.repetitions,
          next_review_at: srs.next_review_at,
        },
        { onConflict: "study_set_id,card_index" }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update flashcard progress: ${error.message}`);
    }
    return data;
  }

  const store = ensureLocalStore();
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

  writeLocalStore(store);
  return store.flashcard_progress.find(
    (p) => p.study_set_id === studySetId && p.card_index === cardIndex
  );
}

/**
 * Record a new quiz attempt
 */
export async function recordQuizAttempt(studySetId, { score, totalQuestions, answers }) {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("quiz_attempts")
      .insert({
        study_set_id: studySetId,
        score,
        total_questions: totalQuestions,
        answers,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record quiz attempt: ${error.message}`);
    }
    return data;
  }

  const store = ensureLocalStore();
  const newAttempt = {
    id: crypto.randomUUID(),
    study_set_id: studySetId,
    score,
    total_questions: totalQuestions,
    answers,
    created_at: new Date().toISOString(),
  };

  store.quiz_attempts.push(newAttempt);
  writeLocalStore(store);
  return newAttempt;
}

/**
 * Checklist operations
 */
export async function listChecklistItems(studySetId = null) {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    let query = supabase.from("checklist_items").select("*").order("order_index", { ascending: true });
    if (studySetId) {
      query = query.eq("study_set_id", studySetId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  const store = ensureLocalStore();
  let items = store.checklist_items || [];
  if (studySetId) {
    items = items.filter((c) => c.study_set_id === studySetId);
  }
  return items.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
}

export async function addChecklistItem({
  task,
  studySetId = null,
  orderIndex = 0,
  scheduledDate = null,
  dueDate = null,
  priority = "medium",
  estimatedMinutes = 20,
}) {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("checklist_items")
      .insert({
        task,
        study_set_id: studySetId,
        order_index: orderIndex,
        completed: false,
        scheduled_date: scheduledDate,
        due_date: dueDate,
        priority,
        estimated_minutes: estimatedMinutes,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const store = ensureLocalStore();
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
  writeLocalStore(store);
  return newItem;
}

export async function addBulkChecklistItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) return [];

  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("checklist_items")
      .insert(
        items.map((item, idx) => ({
          task: item.task,
          study_set_id: item.study_set_id || null,
          order_index: item.order_index ?? idx,
          completed: false,
          scheduled_date: item.scheduled_date || null,
          due_date: item.due_date || null,
          priority: item.priority || "medium",
          estimated_minutes: item.estimated_minutes || 20,
        }))
      )
      .select();

    if (error) throw new Error(error.message);
    return data || [];
  }

  const store = ensureLocalStore();
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

  writeLocalStore(store);
  return created;
}

export async function updateChecklistItem(id, updates) {
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

  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("checklist_items")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const store = ensureLocalStore();
  const idx = store.checklist_items.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  store.checklist_items[idx] = {
    ...store.checklist_items[idx],
    ...dbUpdates,
    updated_at: new Date().toISOString(),
  };

  writeLocalStore(store);
  return store.checklist_items[idx];
}

export async function deleteChecklistItem(id) {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { error } = await supabase.from("checklist_items").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  }

  const store = ensureLocalStore();
  store.checklist_items = store.checklist_items.filter((c) => c.id !== id);
  writeLocalStore(store);
  return true;
}

export async function rescheduleOverdueTasks(todayStr = toDateKey()) {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("checklist_items")
      .update({ scheduled_date: todayStr })
      .eq("completed", false)
      .lt("scheduled_date", todayStr)
      .select();

    if (error) throw new Error(error.message);
    return data || [];
  }

  const store = ensureLocalStore();
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
  writeLocalStore(store);
  return moved;
}

/**
 * Study Goals (Exams & Deadlines)
 */
export async function listStudyGoals() {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("study_goals")
      .select("*")
      .order("exam_date", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  const store = ensureLocalStore();
  return (store.study_goals || []).sort((a, b) => a.exam_date.localeCompare(b.exam_date));
}

export async function getStudyGoalById(id) {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.from("study_goals").select("*").eq("id", id).single();
    if (error) return null;
    return data;
  }

  const store = ensureLocalStore();
  return store.study_goals.find((g) => g.id === id) || null;
}

export async function addStudyGoal({
  title,
  topic = "General",
  studySetId = null,
  examDate,
  dailyMinutes = 30,
}) {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("study_goals")
      .insert({
        title,
        topic,
        study_set_id: studySetId,
        exam_date: examDate,
        daily_minutes: dailyMinutes,
        completed: false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const store = ensureLocalStore();
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
  writeLocalStore(store);
  return newGoal;
}

export async function updateStudyGoal(id, updates) {
  const dbUpdates = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.topic !== undefined) dbUpdates.topic = updates.topic;
  if (updates.examDate !== undefined) dbUpdates.exam_date = updates.examDate;
  if (updates.dailyMinutes !== undefined) dbUpdates.daily_minutes = updates.dailyMinutes;
  if (updates.completed !== undefined) dbUpdates.completed = updates.completed;

  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("study_goals")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const store = ensureLocalStore();
  const idx = store.study_goals.findIndex((g) => g.id === id);
  if (idx === -1) return null;

  store.study_goals[idx] = {
    ...store.study_goals[idx],
    ...dbUpdates,
    updated_at: new Date().toISOString(),
  };
  writeLocalStore(store);
  return store.study_goals[idx];
}

export async function deleteStudyGoal(id) {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { error } = await supabase.from("study_goals").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  }

  const store = ensureLocalStore();
  store.study_goals = store.study_goals.filter((g) => g.id !== id);
  writeLocalStore(store);
  return true;
}

/**
 * Study Sessions (Focus Timer Logs)
 */
export async function listStudySessions() {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("study_sessions")
      .select("*")
      .order("completed_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data || [];
  }

  const store = ensureLocalStore();
  return (store.study_sessions || []).sort(
    (a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime()
  );
}

export async function addStudySession({
  studySetId = null,
  topic = "General",
  durationMinutes,
  activityType = "focus",
}) {
  const nowIso = new Date().toISOString();

  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("study_sessions")
      .insert({
        study_set_id: studySetId,
        topic,
        duration_minutes: durationMinutes,
        activity_type: activityType,
        completed_at: nowIso,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const store = ensureLocalStore();
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
  writeLocalStore(store);
  return session;
}

/**
 * Full Planner Overview
 */
export async function getPlannerOverview() {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const [setsRes, progressRes, attemptsRes, checklistRes, goalsRes, sessionsRes] =
      await Promise.all([
        supabase
          .from("study_sets")
          .select("id, title, topic, mode, flashcards, quiz, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("flashcard_progress").select("*"),
        supabase
          .from("quiz_attempts")
          .select("id, study_set_id, score, total_questions, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("checklist_items")
          .select("*")
          .order("order_index", { ascending: true }),
        supabase.from("study_goals").select("*").order("exam_date", { ascending: true }),
        supabase
          .from("study_sessions")
          .select("*")
          .order("completed_at", { ascending: false })
          .limit(100),
      ]);

    const firstErr =
      setsRes.error ||
      progressRes.error ||
      attemptsRes.error ||
      checklistRes.error ||
      goalsRes.error ||
      sessionsRes.error;
    if (firstErr) throw new Error(firstErr.message);

    return computePlannerSummary({
      studySets: setsRes.data || [],
      progressRows: progressRes.data || [],
      quizAttempts: attemptsRes.data || [],
      checklistItems: checklistRes.data || [],
      goals: goalsRes.data || [],
      sessions: sessionsRes.data || [],
    });
  }

  const store = ensureLocalStore();
  return computePlannerSummary({
    studySets: store.study_sets || [],
    progressRows: store.flashcard_progress || [],
    quizAttempts: store.quiz_attempts || [],
    checklistItems: store.checklist_items || [],
    goals: store.study_goals || [],
    sessions: store.study_sessions || [],
  });
}
