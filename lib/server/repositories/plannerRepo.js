import "server-only";
import { getSupabaseServiceClient, isSupabaseConfigured } from "../supabase";
import { computePlannerSummary } from "../planner";
import { defaultLocalRepo, mapGoalUpdates } from "../localStore";

/**
 * List all study goals ordered by exam date
 */
export async function listStudyGoals() {
  if (!isSupabaseConfigured) {
    return defaultLocalRepo.listStudyGoals();
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("study_goals")
    .select("*")
    .order("exam_date", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Get a single study goal by ID
 */
export async function getStudyGoalById(id) {
  if (!isSupabaseConfigured) {
    return defaultLocalRepo.getStudyGoalById(id);
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("study_goals").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

/**
 * Create a new exam / study goal
 */
export async function addStudyGoal(payload) {
  if (!isSupabaseConfigured) {
    return defaultLocalRepo.addStudyGoal(payload);
  }

  const {
    title,
    topic = "General",
    studySetId = null,
    examDate,
    dailyMinutes = 30,
  } = payload;

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

/**
 * Update an exam / study goal
 */
export async function updateStudyGoal(id, updates) {
  if (!isSupabaseConfigured) {
    return defaultLocalRepo.updateStudyGoal(id, updates);
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("study_goals")
    .update(mapGoalUpdates(updates))
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Delete an exam / study goal
 */
export async function deleteStudyGoal(id) {
  if (!isSupabaseConfigured) {
    return defaultLocalRepo.deleteStudyGoal(id);
  }

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("study_goals").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

/**
 * List recent focus / study sessions
 */
export async function listStudySessions() {
  if (!isSupabaseConfigured) {
    return defaultLocalRepo.listStudySessions();
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("study_sessions")
    .select("*")
    .order("completed_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Log a completed focus / study session
 */
export async function addStudySession(payload) {
  if (!isSupabaseConfigured) {
    return defaultLocalRepo.addStudySession(payload);
  }

  const {
    studySetId = null,
    topic = "General",
    durationMinutes,
    activityType = "focus",
  } = payload;

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("study_sessions")
    .insert({
      study_set_id: studySetId,
      topic,
      duration_minutes: durationMinutes,
      activity_type: activityType,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Aggregate the full /planner dashboard payload
 */
export async function getPlannerOverview() {
  if (!isSupabaseConfigured) {
    return defaultLocalRepo.getPlannerOverview();
  }

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
      supabase.from("checklist_items").select("*").order("order_index", { ascending: true }),
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

