import { API_BASE_URL } from "@/shared/config/api";
import { downloadAuthenticatedFile } from "@/shared/lib/download-file";
import type { CartCustomer, CartItem } from "../types/cart.types";

export async function exportCartInvoiceApi(customer: CartCustomer, items: CartItem[]) {
  await downloadAuthenticatedFile(`${API_BASE_URL}/api/cart/export-invoice`, "phieu-xuat-kho.xlsx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        name: customer.name,
        taxCode: customer.taxCode || undefined,
        address: customer.address || undefined,
      },
      items: items.map((item) => ({
        productId: item.productId,
        code: item.code,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    }),
  });
}
