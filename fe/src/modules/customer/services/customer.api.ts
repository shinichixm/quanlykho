import { API_BASE_URL } from "@/shared/config/api";
import { fetcher } from "@/shared/lib/fetcher";
import type { CustomerInput, CustomerRow } from "../types/customer.types";

type ApiEnvelope<T> = { ok: boolean; data?: T; message?: string };

export async function searchCustomerApi(params: { keyword?: string; page?: number; pageSize?: number }) {
  const res = await fetcher<ApiEnvelope<{ rows: CustomerRow[]; total: number }>>(
    `${API_BASE_URL}/api/customers/search`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: params.keyword || undefined,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
      }),
    }
  );

  if (!res.ok || !res.data) {
    throw new Error(res.message || "Không tải được danh sách khách hàng");
  }

  return res.data;
}

export async function createCustomerApi(input: CustomerInput) {
  const res = await fetcher<ApiEnvelope<CustomerRow>>(`${API_BASE_URL}/api/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok || !res.data) {
    throw new Error(res.message || "Tạo khách hàng thất bại");
  }

  return res.data;
}

export async function updateCustomerApi(id: number, input: CustomerInput) {
  const res = await fetcher<ApiEnvelope<CustomerRow>>(`${API_BASE_URL}/api/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok || !res.data) {
    throw new Error(res.message || "Cập nhật khách hàng thất bại");
  }

  return res.data;
}

export async function deleteCustomerApi(id: number) {
  const res = await fetcher<ApiEnvelope<null>>(`${API_BASE_URL}/api/customers/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(res.message || "Xóa khách hàng thất bại");
  }
}
