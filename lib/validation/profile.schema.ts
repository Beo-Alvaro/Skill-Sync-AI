import { z } from "zod";

const keywordArray = z.array(z.string().min(1).max(64)).max(30);

export const profileSchema = z.object({
  niche: z.string().min(2).max(120),
  experienceLevel: z.enum(["beginner", "intermediate", "expert"]),
  bio: z.string().max(1200).optional().default(""),
  skills: keywordArray,
  tools: keywordArray,
  technologies: keywordArray
});
