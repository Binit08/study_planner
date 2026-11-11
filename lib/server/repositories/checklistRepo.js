import "server-only";
import { getSupabaseServiceClient, isSupabaseConfigured } from "../supabase";
import { toDateKey } from "../planner";
import { defaultLocalRepo, mapChecklistUpdates } from "../localStore";

/**
 * List checklist items, optionally filtered by studySetId
 */
export async function listChecklistItems(studySetId = null) {
  if (!isSupabaseConfigured) {
    return defaultLocalRepo.listChecklistItems(studySetId);
  }

  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("checklist_items")
    .select("*")
    .order("order_index", { ascending: true });
  if (studySetId) {
    query = query.eq("study_set_id", studySetId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Create a single checklist / study task item
 */
export async function addChecklistItem(payload) {
  if (!isSupabaseConfigured) {
    return defaultLocalRepo.addChecklistItem(payload);
  }

  const {
    task,
    studySetId = null,
    orderIndex = 0,
    scheduledDate = null,
    dueDate = null,
    priority = "medium",
    estimatedMinutes = 20,
  } = payload;

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

/**
 * Insert multiple checklist items (used by exam auto-scheduler)
 */
export async function addBulkChecklistItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (!isSupabaseConfigured) {
    return defaultLocalRepo.addBulkChecklistItems(items);
  }

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

/**
 * Update a checklist item
 */
export async function updateChecklistItem(id, updates) {
  if (!isSupabaseConfigured) {
    return defaultLocalRepo.updateChecklistItem(id, updates);
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("checklist_items")
    .update(mapChecklistUpdates(updates))
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Delete a checklist item
 */
export async function deleteChecklistItem(id) {
  if (!isSupabaseConfigured) {
    return defaultLocalRepo.deleteChecklistItem(id);
  }

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("checklist_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

/**
 * Move all unfinished past-due tasks to todayStr
 */
export async function rescheduleOverdueTasks(todayStr = toDateKey()) {
  if (!isSupabaseConfigured) {
    return defaultLocalRepo.rescheduleOverdueTasks(todayStr);
  }

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

