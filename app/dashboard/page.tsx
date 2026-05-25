import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileService } from "@/services/profiles/profile.service";
import { requireCurrentUser } from "@/services/auth/auth.service";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

function getDatabaseErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "";
}

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const db = await createSupabaseServerClient();
  let setupError: string | null = null;
  let profile = null;

  try {
    profile = await new ProfileService(db).getProfile(user.id);
  } catch (error) {
    const message = getDatabaseErrorMessage(error);
    setupError =
      message.includes("freelancer_profiles") || message.includes("schema cache")
        ? "Supabase is connected, but the database schema has not been applied yet. Run supabase/migrations/001_initial_schema.sql in the Supabase SQL Editor."
        : "Unable to load your profile. Check the server logs for the database error.";
  }

  return <DashboardClient initialProfile={profile} setupError={setupError} />;
}
