import { clearAuthToken, getAuthToken, setAuthToken } from "@/shared/lib/auth-token";
import type { AuthUser } from "../types/auth.types";

const USER_KEY = "quanlykho_user";

export function saveAuth(token: string, user: AuthUser) {
  setAuthToken(token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  return getAuthToken();
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuth() {
  clearAuthToken();
  localStorage.removeItem(USER_KEY);
}
