import { z } from "zod";

export const createSearchSchema = z.object({
  query: z.string().min(2).max(120)
});

export const manualImportSchema = z.object({
  mode: z.literal("manual"),
  query: z.string().min(2).max(120).optional(),
  jobs: z
    .array(
      z.object({
        title: z.string().min(2).max(200),
        description: z.string().min(10).max(5000),
        url: z.string().url().optional(),
        budget: z.string().max(120).optional(),
        proposals: z.string().max(120).optional(),
        clientRating: z.number().min(0).max(5).optional(),
        postedDate: z.string().max(120).optional(),
        sourceJobId: z.string().max(200).optional(),
        source: z.enum(["upwork", "manual"]).optional()
      })
    )
    .min(1)
    .max(50)
});
