import { z } from "zod";

export const createSearchSchema = z.object({
  query: z.string().min(2).max(120)
});
