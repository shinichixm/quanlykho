import { API_BASE_URL } from "@/shared/config/api";
import { fetcher } from "@/shared/lib/fetcher";
import type { DashboardSummary } from "../types/dashboard.types";

type ApiEnvelope<T> = { ok: boolean; data?: T; message?: string };

export async function getDashboardSummaryApi() {
  const res = await fetcher<ApiEnvelope<DashboardSummary>>(
    `${API_BASE_URL}/api/dashboard/summary`
  );

  if (!res.ok || !res.data) {
    throw new Error(res.message || "Không tải được dữ liệu dashboard");
  }

  return res.data;
}
