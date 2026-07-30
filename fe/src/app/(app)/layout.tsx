import type { ReactNode } from "react";
import { AppShell } from "@/shared/layout/AppShell";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
