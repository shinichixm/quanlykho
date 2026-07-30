import { z } from "zod";

export const sampleModuleInputSchema = z.object({
  keyword: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});
