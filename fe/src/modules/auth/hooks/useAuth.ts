"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { loginApi } from "../services/auth.api";
import {
  clearAuth,
  getStoredUser,
  saveAuth,
} from "../services/token-storage";
import type { AuthUser } from "../types/auth.types";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setLoading(false);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await loginApi({ username, password });
      saveAuth(result.token, result.user);
      setUser(result.user);
      router.push("/");
    },
    [router]
  );

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    router.push("/login");
  }, [router]);

  return { user, loading, login, logout };
}
