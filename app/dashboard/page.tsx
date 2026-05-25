import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileService } from "@/services/profiles/profile.service";
import { requireCurrentUser } from "@/services/auth/auth.service";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const db = await createSupabaseServerClient();
  const profile = await new ProfileService(db).getProfile(user.id);

  return <DashboardClient initialProfile={profile} />;
}
