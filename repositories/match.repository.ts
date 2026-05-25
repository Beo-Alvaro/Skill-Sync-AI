import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobMatch } from "@/types/match";

type MatchRow = {
  id: string;
  user_id: string;
  search_id: string;
  job_id: string;
  match_percentage: number;
  skill_overlap: string[];
  niche_relevance: number;
  difficulty_estimation: "low" | "medium" | "high";
  why_matches: string;
  missing_skills: string[];
  estimated_fit: string;
  created_at: string;
  scraped_jobs?: {
    id: string;
    source: "upwork";
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
};

export class MatchRepository {
  constructor(private readonly db: SupabaseClient) {}

  async createMany(matches: JobMatch[]): Promise<JobMatch[]> {
    if (matches.length === 0) return [];

    const rows = matches.map((match) => ({
      user_id: match.userId,
      search_id: match.searchId,
      job_id: match.jobId,
      match_percentage: match.matchPercentage,
      skill_overlap: match.skillOverlap,
      niche_relevance: match.nicheRelevance,
      difficulty_estimation: match.difficultyEstimation,
      why_matches: match.whyMatches,
      missing_skills: match.missingSkills,
      estimated_fit: match.estimatedFit
    }));

    const { data, error } = await this.db.from("job_matches").insert(rows).select("*");
    if (error) throw error;
    return (data ?? []).map((row) => this.toDomain(row as MatchRow));
  }

  async listByUser(userId: string, searchId?: string): Promise<JobMatch[]> {
    let query = this.db
      .from("job_matches")
      .select("*, scraped_jobs(*)")
      .eq("user_id", userId)
      .order("match_percentage", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (searchId) {
      query = query.eq("search_id", searchId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row) => this.toDomain(row as MatchRow));
  }

  private toDomain(row: MatchRow): JobMatch {
    return {
      id: row.id,
      userId: row.user_id,
      searchId: row.search_id,
      jobId: row.job_id,
      matchPercentage: row.match_percentage,
      skillOverlap: row.skill_overlap ?? [],
      nicheRelevance: row.niche_relevance,
      difficultyEstimation: row.difficulty_estimation,
      whyMatches: row.why_matches,
      missingSkills: row.missing_skills ?? [],
      estimatedFit: row.estimated_fit,
      createdAt: row.created_at,
      job: row.scraped_jobs
        ? {
            id: row.scraped_jobs.id,
            source: row.scraped_jobs.source,
            sourceJobId: row.scraped_jobs.source_job_id,
            url: row.scraped_jobs.url,
            title: row.scraped_jobs.title,
            description: row.scraped_jobs.description,
            budget: row.scraped_jobs.budget,
            proposals: row.scraped_jobs.proposals,
            clientRating: row.scraped_jobs.client_rating,
            postedDate: row.scraped_jobs.posted_date,
            rawPayload: row.scraped_jobs.raw_payload,
            createdAt: row.scraped_jobs.created_at
          }
        : undefined
    };
  }
}
