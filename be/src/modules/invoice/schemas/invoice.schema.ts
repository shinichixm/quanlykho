import { z } from "zod";

export const invoiceTypeSchema = z.enum(["purchase", "sale"]);

export const invoiceListQuerySchema = z.object({
  type: invoiceTypeSchema,
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  partnerId: z.coerce.number().int().positive().optional(),
  productKeyword: z.string().optional(),
});

export const invoiceBulkDeleteBodySchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1),
});
