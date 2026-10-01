"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MENU_ITEMS } from "../config/menu";
import { useCart } from "@/modules/cart/hooks/useCart";
import { getCompanyInfoApi } from "@/modules/company/services/company.api";
import {
  BoxIcon,
  BuildingIcon,
  CartIcon,
  DashboardIcon,
  InboxDownIcon,
  InboxUpIcon,
  ReceiptIcon,
  ReportIcon,
  SearchCheckIcon,
} from "../ui/icons";

const ICONS = {
  dashboard: DashboardIcon,
  "invoices-in": InboxDownIcon,
  "invoices-out": InboxUpIcon,
  expenses: ReceiptIcon,
  inventory: BoxIcon,
  cart: CartIcon,
  customers: BuildingIcon,
  reconciliation: SearchCheckIcon,
  reports: ReportIcon,
};

export function Sidebar() {
  const pathname = usePathname();
  const { count } = useCart();
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    getCompanyInfoApi()
      .then((data) => setCompanyName(data?.name || ""))
      .catch(() => setCompanyName(""));
  }, []);

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col bg-slate-900 text-slate-300">
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <BoxIcon width={20} height={20} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">Quản lý kho</div>
          <div className="truncate text-xs text-slate-400" title={companyName || "Xuất nhập tồn"}>
            {companyName || "Xuất nhập tồn"}
          </div>
        </div>
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
        {MENU_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = ICONS[item.key];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon width={18} height={18} />
              {item.label}
              {item.key === "cart" && count > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1 text-xs font-semibold text-white">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 px-6 py-4 text-xs text-slate-500">
        v1.0.0
      </div>
    </aside>
  );
}
