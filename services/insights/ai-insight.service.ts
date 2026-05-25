import OpenAI from "openai";
import { appConfig } from "@/lib/config";
import type { JobMatch } from "@/types/match";
import type { FreelancerProfile } from "@/types/profile";
import type { ScrapedJob } from "@/types/job";
import { logger } from "@/utils/logger";

export class AiInsightService {
  private readonly client = appConfig.OPENAI_API_KEY
    ? new OpenAI({ apiKey: appConfig.OPENAI_API_KEY })
    : null;

  async enrichMatches(profile: FreelancerProfile, matches: JobMatch[]): Promise<JobMatch[]> {
    if (!this.client) {
      return matches;
    }

    return Promise.all(
      matches.map(async (match) => {
        if (!match.job) return match;
        return this.enrichMatch(profile, match, match.job);
      })
    );
  }

  private async enrichMatch(
    profile: FreelancerProfile,
    match: JobMatch,
    job: ScrapedJob
  ): Promise<JobMatch> {
    try {
      const response = await this.client!.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a concise freelance job-fit analyst. Return JSON with whyMatches, missingSkills, estimatedFit, difficultyEstimation."
          },
          {
            role: "user",
            content: JSON.stringify({
              profile,
              job: {
                title: job.title,
                description: job.description,
                budget: job.budget,
                proposals: job.proposals,
                clientRating: job.clientRating
              },
              deterministicScore: match.matchPercentage
            })
          }
        ]
      });

      const content = response.choices[0]?.message.content;
      if (!content) return match;

      const parsed = JSON.parse(content) as Partial<JobMatch>;
      return {
        ...match,
        whyMatches: parsed.whyMatches ?? match.whyMatches,
        missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : match.missingSkills,
        estimatedFit: parsed.estimatedFit ?? match.estimatedFit,
        difficultyEstimation:
          parsed.difficultyEstimation === "low" ||
          parsed.difficultyEstimation === "medium" ||
          parsed.difficultyEstimation === "high"
            ? parsed.difficultyEstimation
            : match.difficultyEstimation
      };
    } catch (error) {
      logger.warn("AI insight generation failed; using deterministic insight", { error });
      return match;
    }
  }
}
