import { getAuthToken } from "./auth-token";

export async function fetcher<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init?.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });
  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    if (!response.ok) {
      throw new Error(text);
    }
    throw new Error("Phản hồi không hợp lệ từ máy chủ");
  }

  if (!response.ok) {
    const message =
      typeof parsed === "object" && parsed && "message" in parsed
        ? String((parsed as { message?: unknown }).message)
        : `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return parsed as T;
}
