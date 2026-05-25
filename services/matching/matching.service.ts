import type { ScrapedJob } from "@/types/job";
import type { JobMatch } from "@/types/match";
import type { FreelancerProfile } from "@/types/profile";
import { clampScore, countMatches } from "@/utils/scoring";

type MatchInput = {
  userId: string;
  searchId: string;
  profile: FreelancerProfile;
  jobs: ScrapedJob[];
};

export class MatchingService {
  scoreJobs({ userId, searchId, profile, jobs }: MatchInput): JobMatch[] {
    return jobs
      .filter((job): job is ScrapedJob & { id: string } => Boolean(job.id))
      .map((job) => this.scoreJob(userId, searchId, profile, job))
      .sort((a, b) => b.matchPercentage - a.matchPercentage);
  }

  private scoreJob(
    userId: string,
    searchId: string,
    profile: FreelancerProfile,
    job: ScrapedJob & { id: string }
  ): JobMatch {
    const text = `${job.title} ${job.description}`;
    const skillOverlap = countMatches(profile.skills, text);
    const toolOverlap = countMatches(profile.tools, text);
    const techOverlap = countMatches(profile.technologies, text);
    const nicheRelevant = text.toLowerCase().includes(profile.niche.toLowerCase());
    const proposals = job.proposals?.toLowerCase() ?? "";

    const skillScore = profile.skills.length
      ? (skillOverlap.length / profile.skills.length) * 38
      : 0;
    const toolsScore = profile.tools.length ? (toolOverlap.length / profile.tools.length) * 18 : 0;
    const techScore = profile.technologies.length
      ? (techOverlap.length / profile.technologies.length) * 18
      : 0;
    const nicheScore = nicheRelevant ? 18 : this.partialNicheScore(profile.niche, text);
    const opportunityScore = proposals.includes("less than") ? 8 : proposals.includes("50") ? -5 : 3;

    const matchPercentage = clampScore(skillScore + toolsScore + techScore + nicheScore + opportunityScore);
    const missingSkills = profile.skills.filter((skill) => !skillOverlap.includes(skill)).slice(0, 5);

    return {
      userId,
      searchId,
      jobId: job.id,
      matchPercentage,
      skillOverlap: Array.from(new Set([...skillOverlap, ...toolOverlap, ...techOverlap])),
      nicheRelevance: clampScore(nicheScore * 5),
      difficultyEstimation: this.estimateDifficulty(job.description),
      whyMatches: this.defaultWhy(job.title, skillOverlap, toolOverlap, techOverlap),
      missingSkills,
      estimatedFit:
        matchPercentage >= 80
          ? "Strong fit"
          : matchPercentage >= 60
            ? "Good fit with a targeted proposal"
            : "Partial fit; review requirements carefully",
      job
    };
  }

  private partialNicheScore(niche: string, text: string) {
    const terms = niche.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = terms.filter((term) => text.toLowerCase().includes(term));
    return terms.length ? (matches.length / terms.length) * 12 : 0;
  }

  private estimateDifficulty(description: string) {
    const text = description.toLowerCase();
    const hardSignals = ["enterprise", "complex", "architecture", "scale", "security", "migration"];
    const easySignals = ["simple", "quick", "small", "minor", "fix"];

    if (hardSignals.some((signal) => text.includes(signal))) return "high";
    if (easySignals.some((signal) => text.includes(signal))) return "low";
    return "medium";
  }

  private defaultWhy(title: string, skills: string[], tools: string[], technologies: string[]) {
    const overlap = Array.from(new Set([...skills, ...tools, ...technologies]));
    if (overlap.length === 0) {
      return `${title} has some contextual relevance, but direct skill overlap is limited.`;
    }

    return `${title} matches because it mentions ${overlap.slice(0, 5).join(", ")}.`;
  }
}
