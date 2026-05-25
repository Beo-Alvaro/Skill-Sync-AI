import type { SupabaseClient } from "@supabase/supabase-js";
import type { Search, SearchStatus } from "@/types/search";

type SearchRow = {
  id: string;
  user_id: string;
  query: string;
  status: SearchStatus;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

export class SearchRepository {
  constructor(private readonly db: SupabaseClient) {}

  async create(userId: string, query: string): Promise<Search> {
    const { data, error } = await this.db
      .from("searches")
      .insert({ user_id: userId, query, status: "pending" })
      .select("*")
      .single();

    if (error) throw error;
    return this.toDomain(data as SearchRow);
  }

  async updateStatus(id: string, status: SearchStatus, errorMessage?: string): Promise<void> {
    const { error } = await this.db
      .from("searches")
      .update({
        status,
        error_message: errorMessage ?? null,
        completed_at: status === "completed" || status === "failed" ? new Date().toISOString() : null
      })
      .eq("id", id);

    if (error) throw error;
  }

  async listByUser(userId: string): Promise<Search[]> {
    const { data, error } = await this.db
      .from("searches")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return (data ?? []).map((row) => this.toDomain(row as SearchRow));
  }

  private toDomain(row: SearchRow): Search {
    return {
      id: row.id,
      userId: row.user_id,
      query: row.query,
      status: row.status,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      completedAt: row.completed_at
    };
  }
}
