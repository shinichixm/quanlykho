"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { StatCard } from "@/shared/ui/StatCard";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import {
  BoxIcon,
  InboxDownIcon,
  InboxUpIcon,
  ReportIcon,
} from "@/shared/ui/icons";
import { useDashboardSummary } from "@/modules/dashboard/hooks/useDashboardSummary";

function formatNumber(value: number) {
  return value.toLocaleString("vi-VN");
}

function formatCurrency(value: number) {
  return `${value.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} đ`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}

export default function DashboardPage() {
  const { data, loading, error } = useDashboardSummary();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Tổng quan tình hình kho hàng của bạn"
      />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng sản phẩm"
          value={loading || !data ? "..." : formatNumber(data.totalProducts)}
          hint="Đang quản lý trong kho"
          icon={<BoxIcon width={18} height={18} />}
          accent="blue"
        />
        <StatCard
          label="Hóa đơn đầu vào"
          value={loading || !data ? "..." : formatNumber(data.invoicesInThisMonth)}
          hint="Trong tháng này"
          icon={<InboxDownIcon width={18} height={18} />}
          accent="green"
        />
        <StatCard
          label="Hóa đơn đầu ra"
          value={loading || !data ? "..." : formatNumber(data.invoicesOutThisMonth)}
          hint="Trong tháng này"
          icon={<InboxUpIcon width={18} height={18} />}
          accent="amber"
        />
        <StatCard
          label="Giá trị tồn kho"
          value={loading || !data ? "..." : formatCurrency(data.inventoryValue)}
          hint="Ước tính theo giá nhập"
          icon={<ReportIcon width={18} height={18} />}
          accent="violet"
        />
      </div>

      <Card className="mt-6">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-800">
            Hoạt động gần đây
          </h2>
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">Đang tải...</div>
        ) : !data || data.recentActivities.length === 0 ? (
          <EmptyState
            icon={<ReportIcon width={22} height={22} />}
            title="Chưa có hoạt động nào"
            description="Hóa đơn nhập/xuất gần đây sẽ hiển thị tại đây."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      activity.type === "purchase"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {activity.type === "purchase" ? (
                      <InboxDownIcon width={16} height={16} />
                    ) : (
                      <InboxUpIcon width={16} height={16} />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">
                      {activity.type === "purchase" ? "Nhập kho" : "Xuất kho"} · {activity.invoiceNo}
                    </div>
                    <div className="text-xs text-slate-400">
                      {activity.partnerName} · {formatDate(activity.issuedAt)}
                    </div>
                  </div>
                </div>
                <div className="font-semibold text-slate-800">
                  {formatCurrency(Number(activity.totalAmount))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
