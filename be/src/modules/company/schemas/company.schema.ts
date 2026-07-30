import { z } from "zod";

export const companyInfoInputSchema = z.object({
  name: z.string().min(1, "Tên công ty không được để trống"),
  taxCode: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email không hợp lệ").optional().nullable().or(z.literal("")),
});
