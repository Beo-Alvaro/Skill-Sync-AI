import type { ScrapedJob } from "@/types/job";

export type DifficultyEstimation = "low" | "medium" | "high";

export type JobMatch = {
  id?: string;
  userId: string;
  searchId: string;
  jobId: string;
  matchPercentage: number;
  skillOverlap: string[];
  nicheRelevance: number;
  difficultyEstimation: DifficultyEstimation;
  whyMatches: string;
  missingSkills: string[];
  estimatedFit: string;
  job?: ScrapedJob;
  createdAt?: string;
};
