import { z } from "zod";

export const cartExportInvoiceSchema = z.object({
  customer: z.object({
    name: z.string().min(1, "Tên công ty/khách hàng không được để trống"),
    taxCode: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
  }),
  items: z
    .array(
      z.object({
        productId: z.number(),
        code: z.string(),
        name: z.string(),
        unit: z.string(),
        quantity: z.number().positive("Số lượng phải lớn hơn 0"),
        unitPrice: z.number().nonnegative("Đơn giá không hợp lệ"),
      })
    )
    .min(1, "Giỏ hàng trống"),
});

export type CartExportInvoiceInput = z.infer<typeof cartExportInvoiceSchema>;
