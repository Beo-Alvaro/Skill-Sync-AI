import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScrapedJob } from "@/types/job";

type JobRow = {
  id: string;
  source: "upwork" | "manual";
  source_job_id: string | null;
  url: string | null;
  title: string;
  description: string;
  budget: string | null;
  proposals: string | null;
  client_rating: number | null;
  posted_date: string | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
};

export class JobRepository {
  constructor(private readonly db: SupabaseClient) {}

  async upsertMany(jobs: ScrapedJob[]): Promise<ScrapedJob[]> {
    if (jobs.length === 0) return [];

    const rows = jobs.map((job) => ({
      source: job.source,
      source_job_id: job.sourceJobId ?? job.url ?? `${job.title}:${job.postedDate ?? ""}`,
      url: job.url ?? null,
      title: job.title,
      description: job.description,
      budget: job.budget ?? null,
      proposals: job.proposals ?? null,
      client_rating: job.clientRating ?? null,
      posted_date: job.postedDate ?? null,
      raw_payload: job.rawPayload ?? null
    }));

    const { data, error } = await this.db
      .from("scraped_jobs")
      .upsert(rows, { onConflict: "source,source_job_id" })
      .select("*");

    if (error) throw error;
    return (data ?? []).map((row) => this.toDomain(row as JobRow));
  }

  private toDomain(row: JobRow): ScrapedJob {
    return {
      id: row.id,
      source: row.source,
      sourceJobId: row.source_job_id,
      url: row.url,
      title: row.title,
      description: row.description,
      budget: row.budget,
      proposals: row.proposals,
      clientRating: row.client_rating,
      postedDate: row.posted_date,
      rawPayload: row.raw_payload,
      createdAt: row.created_at
    };
  }
}
