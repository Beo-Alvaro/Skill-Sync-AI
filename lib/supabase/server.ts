import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { appConfig } from "@/lib/config";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function createSupabaseServerClient() {
  if (!appConfig.NEXT_PUBLIC_SUPABASE_URL || !appConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase server environment variables are not configured.");
  }

  const cookieStore = await cookies();

  return createServerClient(
    appConfig.NEXT_PUBLIC_SUPABASE_URL,
    appConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        }
      }
    }
  );
}
