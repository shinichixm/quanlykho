"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { getToken } from "../services/token-storage";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  if (typeof window !== "undefined" && !getToken()) {
    return null;
  }

  return <>{children}</>;
}
