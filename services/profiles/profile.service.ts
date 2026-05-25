import type { SupabaseClient } from "@supabase/supabase-js";
import type { FreelancerProfile, UpsertProfileDto } from "@/types/profile";
import { profileSchema } from "@/lib/validation/profile.schema";
import { ProfileRepository } from "@/repositories/profile.repository";
import { normalizeKeywordList, sanitizeText } from "@/utils/sanitize";

export class ProfileService {
  private readonly profiles: ProfileRepository;

  constructor(db: SupabaseClient) {
    this.profiles = new ProfileRepository(db);
  }

  async getProfile(userId: string): Promise<FreelancerProfile | null> {
    return this.profiles.findByUserId(userId);
  }

  async upsertProfile(userId: string, input: unknown): Promise<FreelancerProfile> {
    const parsed = profileSchema.parse(input);
    const dto: UpsertProfileDto = {
      niche: sanitizeText(parsed.niche),
      experienceLevel: parsed.experienceLevel,
      bio: sanitizeText(parsed.bio ?? ""),
      skills: normalizeKeywordList(parsed.skills),
      tools: normalizeKeywordList(parsed.tools),
      technologies: normalizeKeywordList(parsed.technologies)
    };

    return this.profiles.upsert(userId, dto);
  }
}
