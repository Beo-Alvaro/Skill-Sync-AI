"use client";

import { createBrowserClient } from "@supabase/ssr";
import { appConfig } from "@/lib/config";

export function createSupabaseBrowserClient() {
  if (!appConfig.NEXT_PUBLIC_SUPABASE_URL || !appConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase browser environment variables are not configured.");
  }

  return createBrowserClient(
    appConfig.NEXT_PUBLIC_SUPABASE_URL,
    appConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
