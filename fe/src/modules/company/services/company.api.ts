import { API_BASE_URL } from "@/shared/config/api";
import { fetcher } from "@/shared/lib/fetcher";
import type { CompanyInfo, CompanyInfoInput } from "../types/company.types";

type ApiEnvelope<T> = { ok: boolean; data?: T; message?: string };

export async function getCompanyInfoApi() {
  const res = await fetcher<ApiEnvelope<CompanyInfo | null>>(
    `${API_BASE_URL}/api/company-info`
  );

  if (!res.ok) {
    throw new Error(res.message || "Không tải được thông tin công ty");
  }

  return res.data ?? null;
}

export async function saveCompanyInfoApi(input: CompanyInfoInput) {
  const res = await fetcher<ApiEnvelope<CompanyInfo>>(`${API_BASE_URL}/api/company-info`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok || !res.data) {
    throw new Error(res.message || "Lưu thông tin công ty thất bại");
  }

  return res.data;
}
