import { createClient } from "@supabase/supabase-js";
import { appConfig } from "@/lib/config";

export function createSupabaseAdminClient() {
  if (!appConfig.NEXT_PUBLIC_SUPABASE_URL || !appConfig.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin environment variables are not configured.");
  }

  return createClient(appConfig.NEXT_PUBLIC_SUPABASE_URL, appConfig.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
