import { API_BASE_URL } from "@/shared/config/api";
import { fetcher } from "@/shared/lib/fetcher";
import { downloadAuthenticatedFile } from "@/shared/lib/download-file";
import type {
  InStockProduct,
  ReconciliationInvoiceRow,
  ReconciliationStatus,
} from "../types/reconciliation.types";

type ApiEnvelope<T> = { ok: boolean; data?: T; message?: string };

export type SubstitutionInput = {
  invoiceItemId: number;
  substituteProductId: number;
  quantity: number;
};

export async function listReconciliationInvoicesApi(
  status: ReconciliationStatus | undefined,
  page = 1,
  pageSize = 20
) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status) params.set("status", status);

  const res = await fetcher<ApiEnvelope<{ rows: ReconciliationInvoiceRow[]; total: number }>>(
    `${API_BASE_URL}/api/reconciliation/invoices?${params.toString()}`
  );

  if (!res.ok || !res.data) {
    throw new Error(res.message || "Không tải được danh sách tra soát hóa đơn");
  }

  return res.data;
}

export async function listInStockProductsApi(keyword = "") {
  const params = new URLSearchParams();
  if (keyword) params.set("keyword", keyword);

  const res = await fetcher<ApiEnvelope<InStockProduct[]>>(
    `${API_BASE_URL}/api/reconciliation/products-in-stock?${params.toString()}`
  );

  if (!res.ok || !res.data) {
    throw new Error(res.message || "Không tải được danh sách sản phẩm còn hàng");
  }

  return res.data;
}

export async function saveInvoiceSubstitutionsApi(
  invoiceId: number,
  action: "draft" | "complete",
  entries: SubstitutionInput[]
) {
  const res = await fetcher<ApiEnvelope<ReconciliationInvoiceRow>>(
    `${API_BASE_URL}/api/reconciliation/invoices/${invoiceId}/substitutions`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, entries }),
    }
  );

  if (!res.ok || !res.data) {
    throw new Error(res.message || "Lưu tra soát hóa đơn thất bại");
  }

  return res.data;
}

export async function exportReconciliationInvoiceApi(invoiceId: number, invoiceNo: string) {
  await downloadAuthenticatedFile(
    `${API_BASE_URL}/api/reconciliation/invoices/${invoiceId}/export`,
    `chi-tiet-bo-sung-hoa-don-${invoiceNo}.xlsx`
  );
}
