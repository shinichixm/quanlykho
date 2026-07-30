import { z } from "zod";

export const inventoryStatusSchema = z.enum(["in_stock", "out_of_stock"]);

export const inventoryListQuerySchema = z.object({
  keyword: z.string().optional(),
  status: inventoryStatusSchema.optional(),
  periodFrom: z.coerce.date().optional(),
  periodTo: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(10000).default(50),
});
