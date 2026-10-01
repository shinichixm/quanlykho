import { API_BASE_URL } from "@/shared/config/api";
import { fetcher } from "@/shared/lib/fetcher";
import type {
  ConfirmInvoiceRow,
  InvoiceCategory,
  InvoiceDetail,
  InvoiceListItem,
  InvoicePartnerOption,
  InvoiceType,
  PreviewInvoiceRow,
} from "../types/invoice.types";

type ApiEnvelope<T> = { ok: boolean; data?: T; message?: string };

function buildFilesFormData(files: File[], type: InvoiceType) {
  const formData = new FormData();
  formData.append("type", type);
  files.forEach((file) => formData.append("files", file));
  return formData;
}

export async function previewInvoicesApi(files: File[], type: InvoiceType) {
  const res = await fetcher<ApiEnvelope<PreviewInvoiceRow[]>>(
    `${API_BASE_URL}/api/invoices/preview`,
    { method: "POST", body: buildFilesFormData(files, type) }
  );

  if (!res.ok || !res.data) {
    throw new Error(res.message || "Xem trước hóa đơn thất bại");
  }

  return res.data;
}

export async function confirmInvoicesApi(
  files: File[],
  type: InvoiceType,
  categories?: Record<string, InvoiceCategory>
) {
  const formData = buildFilesFormData(files, type);
  if (categories && Object.keys(categories).length > 0) {
    formData.append("categories", JSON.stringify(categories));
  }

  const res = await fetcher<ApiEnvelope<ConfirmInvoiceRow[]>>(
    `${API_BASE_URL}/api/invoices/confirm`,
    { method: "POST", body: formData }
  );

  if (!res.ok || !res.data) {
    throw new Error(res.message || "Xác nhận nạp hóa đơn thất bại");
  }

  return res.data;
}

export async function listInvoicesApi(
  type: InvoiceType,
  page = 1,
  pageSize = 20,
  dateFrom?: string,
  dateTo?: string,
  partnerId?: number,
  productKeyword?: string,
  category?: InvoiceCategory
) {
  const params = new URLSearchParams({ type, page: String(page), pageSize: String(pageSize) });
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (partnerId) params.set("partnerId", String(partnerId));
  if (productKeyword) params.set("productKeyword", productKeyword);
  if (category) params.set("category", category);

  const res = await fetcher<
    ApiEnvelope<{ rows: InvoiceListItem[]; total: number; totalAmountSum: string }>
  >(`${API_BASE_URL}/api/invoices?${params.toString()}`);

  if (!res.ok || !res.data) {
    throw new Error(res.message || "Không tải được danh sách hóa đơn");
  }

  return res.data;
}

export async function listInvoicePartnersApi(type: InvoiceType) {
  const res = await fetcher<ApiEnvelope<InvoicePartnerOption[]>>(
    `${API_BASE_URL}/api/invoices/partners?type=${type}`
  );

  if (!res.ok || !res.data) {
    throw new Error(res.message || "Không tải được danh sách công ty");
  }

  return res.data;
}

export async function deleteInvoiceApi(id: number) {
  const res = await fetcher<ApiEnvelope<{ id: number }>>(
    `${API_BASE_URL}/api/invoices/${id}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    throw new Error(res.message || "Xóa hóa đơn thất bại");
  }
}

export async function deleteInvoicesBulkApi(ids: number[]) {
  const res = await fetcher<ApiEnvelope<{ deletedCount: number }>>(
    `${API_BASE_URL}/api/invoices/bulk`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }
  );

  if (!res.ok || !res.data) {
    throw new Error(res.message || "Xóa hóa đơn thất bại");
  }

  return res.data;
}

export async function getInvoiceDetailApi(id: number) {
  const res = await fetcher<ApiEnvelope<InvoiceDetail>>(
    `${API_BASE_URL}/api/invoices/${id}`
  );

  if (!res.ok || !res.data) {
    throw new Error(res.message || "Không tải được chi tiết hóa đơn");
  }

  return res.data;
}
