import type { ScrapedJob } from "@/types/job";

export type ScraperSearchOptions = {
  query: string;
  limit?: number;
};

export type JobScraper = {
  searchJobs(options: ScraperSearchOptions): Promise<ScrapedJob[]>;
};
