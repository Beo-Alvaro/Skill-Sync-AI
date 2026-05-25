import type { SupabaseClient } from "@supabase/supabase-js";
import type { FreelancerProfile, UpsertProfileDto } from "@/types/profile";

type ProfileRow = {
  id: string;
  user_id: string;
  niche: string;
  experience_level: "beginner" | "intermediate" | "expert";
  bio: string | null;
  created_at: string;
  updated_at: string;
};

export class ProfileRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findByUserId(userId: string): Promise<FreelancerProfile | null> {
    const { data: profile, error } = await this.db
      .from("freelancer_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!profile) return null;

    const [skills, tools, technologies] = await Promise.all([
      this.listProfileValues("profile_skills", "skill", profile.id),
      this.listProfileValues("profile_tools", "tool", profile.id),
      this.listProfileValues("profile_technologies", "technology", profile.id)
    ]);

    return this.toDomain(profile as ProfileRow, skills, tools, technologies);
  }

  async upsert(userId: string, dto: UpsertProfileDto): Promise<FreelancerProfile> {
    const { data: profile, error } = await this.db
      .from("freelancer_profiles")
      .upsert(
        {
          user_id: userId,
          niche: dto.niche,
          experience_level: dto.experienceLevel,
          bio: dto.bio ?? null,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      )
      .select("*")
      .single();

    if (error) throw error;

    await Promise.all([
      this.replaceProfileValues("profile_skills", "skill", profile.id, dto.skills),
      this.replaceProfileValues("profile_tools", "tool", profile.id, dto.tools),
      this.replaceProfileValues("profile_technologies", "technology", profile.id, dto.technologies)
    ]);

    return this.toDomain(profile as ProfileRow, dto.skills, dto.tools, dto.technologies);
  }

  private async listProfileValues(table: string, column: string, profileId: string): Promise<string[]> {
    const { data, error } = await this.db.from(table).select(column).eq("profile_id", profileId);
    if (error) throw error;
    return (data ?? []).map((row) => String((row as unknown as Record<string, unknown>)[column]));
  }

  private async replaceProfileValues(
    table: string,
    column: string,
    profileId: string,
    values: string[]
  ) {
    const deleteResult = await this.db.from(table).delete().eq("profile_id", profileId);
    if (deleteResult.error) throw deleteResult.error;

    if (values.length === 0) {
      return;
    }

    const rows = values.map((value) => ({ profile_id: profileId, [column]: value }));
    const insertResult = await this.db.from(table).insert(rows);
    if (insertResult.error) throw insertResult.error;
  }

  private toDomain(
    row: ProfileRow,
    skills: string[],
    tools: string[],
    technologies: string[]
  ): FreelancerProfile {
    return {
      id: row.id,
      userId: row.user_id,
      niche: row.niche,
      experienceLevel: row.experience_level,
      bio: row.bio,
      skills,
      tools,
      technologies,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
