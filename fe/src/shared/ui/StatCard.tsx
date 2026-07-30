import type { ReactNode } from "react";

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  accent?: "blue" | "green" | "amber" | "violet";
};

const ACCENT = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
};

export function StatCard({ label, value, hint, icon, accent = "blue" }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${ACCENT[accent]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 text-2xl font-semibold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}
