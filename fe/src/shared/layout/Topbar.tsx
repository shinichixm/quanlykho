"use client";

import Link from "next/link";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { BuildingIcon } from "@/shared/ui/icons";

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="text-sm text-slate-500">
        Chào mừng quay lại,{" "}
        <span className="font-medium text-slate-800">
          {user?.fullName || "Người dùng"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
          {(user?.fullName || "?").charAt(0).toUpperCase()}
        </div>
        <Link
          href="/settings/company"
          title="Thông tin công ty"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <BuildingIcon width={16} height={16} />
        </Link>
        <button
          onClick={logout}
          className="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
