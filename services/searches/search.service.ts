import type { SupabaseClient } from "@supabase/supabase-js";
import { createSearchSchema, manualImportSchema } from "@/lib/validation/search.schema";
import { JobRepository } from "@/repositories/job.repository";
import { MatchRepository } from "@/repositories/match.repository";
import { ProfileRepository } from "@/repositories/profile.repository";
import { SearchRepository } from "@/repositories/search.repository";
import { AiInsightService } from "@/services/insights/ai-insight.service";
import { MatchingService } from "@/services/matching/matching.service";
import { RateLimitService } from "@/services/rate-limit/rate-limit.service";
import type { JobScraper } from "@/services/scraper/scraper.types";
import { UpworkPlaywrightScraper } from "@/services/scraper/upwork-scraper.service";
import type { ScrapedJob } from "@/types/job";
import type { JobMatch } from "@/types/match";
import type { Search } from "@/types/search";
import { AppError } from "@/utils/errors";
import { sanitizeText } from "@/utils/sanitize";

const rateLimiter = new RateLimitService(5, 10 * 60 * 1000);

export class SearchService {
  private readonly searches: SearchRepository;
  private readonly profiles: ProfileRepository;
  private readonly jobs: JobRepository;
  private readonly matches: MatchRepository;
  private readonly matcher = new MatchingService();
  private readonly insights = new AiInsightService();

  constructor(
    db: SupabaseClient,
    private readonly scraper: JobScraper = new UpworkPlaywrightScraper(),
    adminDb?: SupabaseClient
  ) {
    this.searches = new SearchRepository(db);
    this.profiles = new ProfileRepository(db);
    this.jobs = new JobRepository(adminDb ?? db);
    this.matches = new MatchRepository(adminDb ?? db);
  }

  async runSearch(userId: string, input: unknown): Promise<{ search: Search; matches: JobMatch[] }> {
    rateLimiter.assertAllowed(userId);

    const parsed = createSearchSchema.parse(input);
    const query = sanitizeText(parsed.query);
    const profile = await this.profiles.findByUserId(userId);

    if (!profile) {
      throw new AppError("Create your freelancer profile before searching for jobs.", 409);
    }

    const search = await this.searches.create(userId, query);
    await this.searches.updateStatus(search.id, "running");

    try {
      const scrapedJobs = await this.scraper.searchJobs({ query, limit: 10 });
      const storedJobs = await this.jobs.upsertMany(scrapedJobs);
      const deterministicMatches = this.matcher.scoreJobs({
        userId,
        searchId: search.id,
        profile,
        jobs: storedJobs
      });
      const enrichedMatches = await this.insights.enrichMatches(profile, deterministicMatches);
      const savedMatches = await this.matches.createMany(enrichedMatches);

      await this.searches.updateStatus(search.id, "completed");

      return {
        search: { ...search, status: "completed", completedAt: new Date().toISOString() },
        matches: savedMatches
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Search failed";
      await this.searches.updateStatus(search.id, "failed", message);
      throw error;
    }
  }

  async runManualSearch(userId: string, input: unknown): Promise<{ search: Search; matches: JobMatch[] }> {
    rateLimiter.assertAllowed(userId);

    const parsed = manualImportSchema.parse(input);
    const query = sanitizeText(parsed.query ?? "Manual import");
    const profile = await this.profiles.findByUserId(userId);

    if (!profile) {
      throw new AppError("Create your freelancer profile before searching for jobs.", 409);
    }

    const search = await this.searches.create(userId, query);
    await this.searches.updateStatus(search.id, "running");

    try {
      const sanitizedJobs = parsed.jobs.map((job) => this.toManualJob(job));
      const storedJobs = await this.jobs.upsertMany(sanitizedJobs);
      const deterministicMatches = this.matcher.scoreJobs({
        userId,
        searchId: search.id,
        profile,
        jobs: storedJobs
      });
      const enrichedMatches = await this.insights.enrichMatches(profile, deterministicMatches);
      const savedMatches = await this.matches.createMany(enrichedMatches);

      await this.searches.updateStatus(search.id, "completed");

      return {
        search: { ...search, status: "completed", completedAt: new Date().toISOString() },
        matches: savedMatches
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Search failed";
      await this.searches.updateStatus(search.id, "failed", message);
      throw error;
    }
  }

  async listSearches(userId: string): Promise<Search[]> {
    return this.searches.listByUser(userId);
  }

  private toManualJob(job: {
    title: string;
    description: string;
    url?: string;
    budget?: string;
    proposals?: string;
    clientRating?: number;
    postedDate?: string;
    sourceJobId?: string;
    source?: "upwork" | "manual";
  }): ScrapedJob {
    return {
      source: job.source ?? "manual",
      sourceJobId: job.sourceJobId,
      url: job.url,
      title: sanitizeText(job.title),
      description: sanitizeText(job.description),
      budget: job.budget ? sanitizeText(job.budget) : undefined,
      proposals: job.proposals ? sanitizeText(job.proposals) : undefined,
      clientRating: job.clientRating,
      postedDate: job.postedDate ? sanitizeText(job.postedDate) : undefined,
      rawPayload: { manual: true }
    };
  }
}
