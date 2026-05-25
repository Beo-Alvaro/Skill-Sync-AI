import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MatchRepository } from "@/repositories/match.repository";
import { requireCurrentUser } from "@/services/auth/auth.service";
import { handleApiError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const url = new URL(request.url);
    const searchId = url.searchParams.get("searchId") ?? undefined;
    const db = await createSupabaseServerClient();
    const matches = await new MatchRepository(db).listByUser(user.id, searchId);

    return NextResponse.json({ data: matches });
  } catch (error) {
    return handleApiError(error);
  }
}
