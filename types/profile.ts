export type ExperienceLevel = "beginner" | "intermediate" | "expert";

export type FreelancerProfile = {
  id: string;
  userId: string;
  niche: string;
  experienceLevel: ExperienceLevel;
  bio?: string | null;
  skills: string[];
  tools: string[];
  technologies: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type UpsertProfileDto = {
  niche: string;
  experienceLevel: ExperienceLevel;
  bio?: string;
  skills: string[];
  tools: string[];
  technologies: string[];
};
