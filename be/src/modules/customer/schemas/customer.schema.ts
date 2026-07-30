import { z } from "zod";

export const customerInputSchema = z.object({
  name: z.string().min(1, "Tên khách hàng không được để trống"),
  taxCode: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
});

export const customerUpdateSchema = customerInputSchema.partial();

export const customerSearchSchema = z.object({
  keyword: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(200).default(20),
});
