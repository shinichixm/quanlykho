import { z } from "zod";

export const reconciliationStatusSchema = z.enum(["completed", "negative_stock"]);

export const reconciliationListQuerySchema = z.object({
  status: reconciliationStatusSchema.optional(),
  partnerId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(20),
});

export const substitutionEntrySchema = z.object({
  invoiceItemId: z.coerce.number().int().positive(),
  substituteProductId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive(),
});

export const saveSubstitutionsBodySchema = z.object({
  action: z.enum(["draft", "complete"]),
  entries: z.array(substitutionEntrySchema),
});
