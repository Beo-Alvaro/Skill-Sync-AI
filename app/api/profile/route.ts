import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentUser } from "@/services/auth/auth.service";
import { ProfileService } from "@/services/profiles/profile.service";
import { handleApiError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const db = await createSupabaseServerClient();
    const service = new ProfileService(db);
    const profile = await service.getProfile(user.id);

    return NextResponse.json({ data: profile });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const db = await createSupabaseServerClient();
    const service = new ProfileService(db);
    const body = await request.json();
    const profile = await service.upsertProfile(user.id, body);

    return NextResponse.json({ data: profile });
  } catch (error) {
    return handleApiError(error);
  }
}
