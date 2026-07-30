"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Pagination } from "@/shared/ui/Pagination";
import { SearchCheckIcon } from "@/shared/ui/icons";
import { useReconciliationList } from "@/modules/reconciliation/hooks/useReconciliationList";
import { ReconciliationTable } from "@/modules/reconciliation/components/ReconciliationTable";
import type { ReconciliationStatus } from "@/modules/reconciliation/types/reconciliation.types";

const STATUS_TABS: { value: ReconciliationStatus | undefined; label: string }[] = [
  { value: undefined, label: "Tất cả" },
  { value: "completed", label: "Hoàn thành" },
  { value: "negative_stock", label: "Âm kho" },
];

export default function ReconciliationPage() {
  const { rows, total, page, pageSize, setPage, status, setStatus, loading, error, refetch } =
    useReconciliationList();

  return (
    <div>
      <PageHeader
        title="Tra soát hóa đơn"
        description="Đối chiếu sản phẩm trong hóa đơn bán ra với tồn kho hiện tại để phát hiện hóa đơn xuất bán khi không còn hàng — mục này chỉ dùng để đối chiếu, không ảnh hưởng đến nghiệp vụ tồn kho"
      />

      <div className="mb-4 flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              status === tab.value
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">Đang tải...</div>
        ) : error ? (
          <div className="px-5 py-10 text-center text-sm text-red-600">{error}</div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<SearchCheckIcon width={22} height={22} />}
            title="Không có hóa đơn nào"
            description="Chưa có hóa đơn bán ra nào để đối chiếu."
          />
        ) : (
          <>
            <ReconciliationTable
              rows={rows}
              startIndex={(page - 1) * pageSize}
              onChanged={refetch}
            />
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
