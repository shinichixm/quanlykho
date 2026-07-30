import { API_BASE_URL } from "@/shared/config/api";
import { fetcher } from "@/shared/lib/fetcher";
import type { LoginInput, LoginResult } from "../types/auth.types";

export async function loginApi(input: LoginInput) {
  const res = await fetcher<{ ok: boolean; data?: LoginResult; message?: string }>(
    `${API_BASE_URL}/api/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );

  if (!res.ok || !res.data) {
    throw new Error(res.message || "Đăng nhập thất bại");
  }

  return res.data;
}
