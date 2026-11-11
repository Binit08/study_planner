import "server-only";
import { getSupabaseServiceClient, isSupabaseConfigured } from "../supabase";
import { calculateNextReview } from "../planner";
import { attachSetStats, defaultLocalRepo } from "../localStore";

/**
 * List all study sets ordered by creation date descending with progress and attempt counts
 */
export async function listStudySets() {
  if (!isSupabaseConfigured) {
    return defaultLocalRepo.listStudySets();
  }

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

  return attachSetStats(setsRes.data || [], progressRes.data || [], attemptsRes.data || []);
}

/**
 * Get a specific study set by ID with associated progress, attempts, and checklist
 */
export async function getStudySetById(id) {
  if (!id) throw new Error("Study set ID is required");

  if (!isSupabaseConfigured) {
    return defaultLocalRepo.getStudySetById(id);
  }

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

/**
 * Create a new study set and optional initial checklist items
 */
export async function createStudySet(payload) {
  if (!payload?.title) throw new Error("Title is required to save a study set");

  if (!isSupabaseConfigured) {
    return defaultLocalRepo.createStudySet(payload);
  }

  const {
    title,
    topic = "General",
    sourceType = "text",
    sourcePreview = "",
    mode = "both",
    flashcards = [],
    quiz = [],
    checklist = [],
  } = payload;

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

/**
 * Delete a study set and cascade
 */
export async function deleteStudySet(id) {
  if (!isSupabaseConfigured) {
    return defaultLocalRepo.deleteStudySet(id);
  }

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("study_sets").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete study set from Supabase: ${error.message}`);
  }
  return true;
}

/**
 * Upsert flashcard progress with SM-2 spaced repetition scheduling
 */
export async function updateFlashcardProgress(studySetId, cardIndex, status) {
  if (!isSupabaseConfigured) {
    return defaultLocalRepo.updateFlashcardProgress(studySetId, cardIndex, status);
  }

  const now = new Date();
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
        last_reviewed_at: now.toISOString(),
        ...srs,
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

/**
 * Record a new quiz attempt
 */
export async function recordQuizAttempt(studySetId, attempt) {
  if (!isSupabaseConfigured) {
    return defaultLocalRepo.recordQuizAttempt(studySetId, attempt);
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert({
      study_set_id: studySetId,
      score: attempt.score,
      total_questions: attempt.totalQuestions,
      answers: attempt.answers,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to record quiz attempt: ${error.message}`);
  }
  return data;
}

