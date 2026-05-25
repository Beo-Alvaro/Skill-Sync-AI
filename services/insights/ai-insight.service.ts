import OpenAI from "openai";
import { appConfig } from "@/lib/config";
import type { JobMatch } from "@/types/match";
import type { FreelancerProfile } from "@/types/profile";
import type { ScrapedJob } from "@/types/job";
import { logger } from "@/utils/logger";

type AiInsightPayload = {
  whyMatches?: string;
  missingSkills?: unknown;
  estimatedFit?: string;
  difficultyEstimation?: unknown;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

export class AiInsightService {
  private readonly openAiClient = appConfig.OPENAI_API_KEY
    ? new OpenAI({ apiKey: appConfig.OPENAI_API_KEY })
    : null;

  async enrichMatches(profile: FreelancerProfile, matches: JobMatch[]): Promise<JobMatch[]> {
    if (!this.isConfigured()) {
      return matches;
    }

    return Promise.all(
      matches.map(async (match) => {
        if (!match.job) return match;
        return this.enrichMatch(profile, match, match.job);
      })
    );
  }

  private isConfigured() {
    if (appConfig.AI_PROVIDER === "gemini") {
      return Boolean(appConfig.GEMINI_API_KEY);
    }

    return Boolean(this.openAiClient);
  }

  private async enrichMatch(
    profile: FreelancerProfile,
    match: JobMatch,
    job: ScrapedJob
  ): Promise<JobMatch> {
    try {
      const parsed =
        appConfig.AI_PROVIDER === "gemini"
          ? await this.generateGeminiInsight(profile, match, job)
          : await this.generateOpenAiInsight(profile, match, job);

      return this.applyInsight(match, parsed);
    } catch (error) {
      logger.warn("AI insight generation failed; using deterministic insight", { error });
      return match;
    }
  }

  private async generateOpenAiInsight(
    profile: FreelancerProfile,
    match: JobMatch,
    job: ScrapedJob
  ): Promise<AiInsightPayload> {
    const response = await this.openAiClient!.chat.completions.create({
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
    return content ? (JSON.parse(content) as AiInsightPayload) : {};
  }

  private async generateGeminiInsight(
    profile: FreelancerProfile,
    match: JobMatch,
    job: ScrapedJob
  ): Promise<AiInsightPayload> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      appConfig.GEMINI_MODEL
    )}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": appConfig.GEMINI_API_KEY!
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "You are a concise freelance job-fit analyst. Return only valid JSON with whyMatches, missingSkills, estimatedFit, difficultyEstimation."
            }
          ]
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: JSON.stringify({
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
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Gemini API request failed: ${response.status} ${message}`);
    }

    const payload = (await response.json()) as GeminiGenerateContentResponse;
    const content = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    return content ? (JSON.parse(content) as AiInsightPayload) : {};
  }

  private applyInsight(match: JobMatch, parsed: AiInsightPayload): JobMatch {
    return {
      ...match,
      whyMatches: parsed.whyMatches ?? match.whyMatches,
      missingSkills: this.toStringArray(parsed.missingSkills, match.missingSkills),
      estimatedFit: parsed.estimatedFit ?? match.estimatedFit,
      difficultyEstimation:
        parsed.difficultyEstimation === "low" ||
        parsed.difficultyEstimation === "medium" ||
        parsed.difficultyEstimation === "high"
          ? parsed.difficultyEstimation
          : match.difficultyEstimation
    };
  }

  private toStringArray(value: unknown, fallback: string[]) {
    if (!Array.isArray(value)) return fallback;
    return value.filter((item): item is string => typeof item === "string");
  }
}
