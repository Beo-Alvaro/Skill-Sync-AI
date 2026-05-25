import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentUser } from "@/services/auth/auth.service";
import { SearchService } from "@/services/searches/search.service";
import { handleApiError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const db = await createSupabaseServerClient();
    const service = new SearchService(db);
    const searches = await service.listSearches(user.id);

    return NextResponse.json({ data: searches });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const db = await createSupabaseServerClient();
    const service = new SearchService(db);
    const body = await request.json();
    const result = body?.mode === "manual"
      ? await service.runManualSearch(user.id, body)
      : await service.runSearch(user.id, body);

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
