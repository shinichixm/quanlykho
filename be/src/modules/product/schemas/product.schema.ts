import { z } from "zod";

export const productInputSchema = z.object({
  code: z.string().min(1, "Mã hàng không được để trống"),
  name: z.string().min(1, "Tên hàng không được để trống"),
  unit: z.string().min(1, "Đơn vị tính không được để trống"),
});

export const productUpdateSchema = productInputSchema.partial();

export const productSearchSchema = z.object({
  keyword: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});
