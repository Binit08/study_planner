import "server-only";
import fs from "fs";
import path from "path";
import { getSupabaseServiceClient, isSupabaseConfigured } from "./supabase";

// Local storage fallback for zero-config testing when Supabase env vars are empty
const DATA_DIR = path.join(process.cwd(), ".data");
const LOCAL_STORE_FILE = path.join(DATA_DIR, "study_store.json");

function ensureLocalStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_STORE_FILE)) {
    const initial = {
      study_sets: [],
      flashcard_progress: [],
      quiz_attempts: [],
      checklist_items: [],
    };
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
  try {
    const raw = fs.readFileSync(LOCAL_STORE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return {
      study_sets: [],
      flashcard_progress: [],
      quiz_attempts: [],
      checklist_items: [],
    };
  }
}

function writeLocalStore(data) {
  ensureLocalStore();
  fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(data, null, 2), "utf8");
}

/**
 * List all study sets ordered by creation date descending
 */
export async function listStudySets() {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("study_sets")
      .select("id, title, topic, source_type, source_preview, mode, flashcards, quiz, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list study sets from Supabase: ${error.message}`);
    }
    return data || [];
  }

  const store = ensureLocalStore();
  return (store.study_sets || []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
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
 * Upsert flashcard progress (unseen, learning, mastered)
 */
export async function updateFlashcardProgress(studySetId, cardIndex, status) {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("flashcard_progress")
      .upsert(
        {
          study_set_id: studySetId,
          card_index: cardIndex,
          status,
          last_reviewed_at: new Date().toISOString(),
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

  const now = new Date().toISOString();
  if (existingIndex >= 0) {
    store.flashcard_progress[existingIndex].status = status;
    store.flashcard_progress[existingIndex].last_reviewed_at = now;
    store.flashcard_progress[existingIndex].updated_at = now;
  } else {
    store.flashcard_progress.push({
      id: crypto.randomUUID(),
      study_set_id: studySetId,
      card_index: cardIndex,
      status,
      last_reviewed_at: now,
      created_at: now,
      updated_at: now,
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

export async function addChecklistItem({ task, studySetId = null, orderIndex = 0 }) {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("checklist_items")
      .insert({
        task,
        study_set_id: studySetId,
        order_index: orderIndex,
        completed: false,
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
    created_at: now,
    updated_at: now,
  };
  store.checklist_items.push(newItem);
  writeLocalStore(store);
  return newItem;
}

export async function updateChecklistItem(id, updates) {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("checklist_items")
      .update(updates)
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
    ...updates,
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
