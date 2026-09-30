import { API_BASE_URL } from "@/shared/config/api";
import { fetcher } from "@/shared/lib/fetcher";
import { downloadAuthenticatedFile } from "@/shared/lib/download-file";
import type { InventoryRow, InventoryStatus } from "../types/inventory.types";

type ApiEnvelope<T> = { ok: boolean; data?: T; message?: string };

export type InventoryQuery = {
  keyword?: string;
  status?: InventoryStatus;
  periodFrom?: string;
  periodTo?: string;
};

function buildParams(query: InventoryQuery, extra: Record<string, string>) {
  const params = new URLSearchParams(extra);
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.status) params.set("status", query.status);
  if (query.periodFrom) params.set("periodFrom", query.periodFrom);
  if (query.periodTo) params.set("periodTo", query.periodTo);
  return params;
}

export async function listInventoryApi(query: InventoryQuery, page = 1, pageSize = 50) {
  const params = buildParams(query, { page: String(page), pageSize: String(pageSize) });

  const res = await fetcher<ApiEnvelope<{ rows: InventoryRow[]; total: number }>>(
    `${API_BASE_URL}/api/inventory?${params.toString()}`
  );

  if (!res.ok || !res.data) {
    throw new Error(res.message || "Không tải được danh sách tồn kho");
  }

  return res.data;
}

export async function exportInventoryExcelApi(query: InventoryQuery) {
  const params = buildParams(query, {});
  await downloadAuthenticatedFile(
    `${API_BASE_URL}/api/inventory/export?${params.toString()}`,
    "bao-cao-nhap-xuat-ton.xlsx"
  );
}

export type CreateProductInput = {
  code: string;
  name: string;
  unit: string;
};

export async function createProductApi(input: CreateProductInput) {
  const res = await fetcher<ApiEnvelope<{ id: number }>>(`${API_BASE_URL}/api/product`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok || !res.data) {
    throw new Error(res.message || "Không thêm được sản phẩm");
  }

  return res.data;
}
