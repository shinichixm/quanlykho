import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon}
      </div>
      <div className="text-sm font-medium text-slate-700">{title}</div>
      {description && (
        <div className="max-w-sm text-sm text-slate-400">{description}</div>
      )}
      {action}
    </div>
  );
}
