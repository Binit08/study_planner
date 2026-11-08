import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseServiceKey &&
    supabaseUrl.startsWith("http") &&
    !supabaseUrl.includes("your-project.supabase.co") &&
    supabaseServiceKey !== "your_supabase_service_role_key_here"
);

let supabaseClient = null;

export function getSupabaseServiceClient() {
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
}
