import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/utils/errors";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}

export async function requireCurrentUser(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AppError("Authentication required", 401);
  }

  return user;
}
