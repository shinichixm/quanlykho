"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Pagination } from "@/shared/ui/Pagination";
import { Button } from "@/shared/ui/Button";
import { BoxIcon, DownloadIcon, PlusIcon } from "@/shared/ui/icons";
import { useInventoryList } from "@/modules/inventory/hooks/useInventoryList";
import { InventoryTable } from "@/modules/inventory/components/InventoryTable";
import { AddProductModal } from "@/modules/inventory/components/AddProductModal";
import { exportInventoryExcelApi } from "@/modules/inventory/services/inventory.api";
import type { InventoryStatus } from "@/modules/inventory/types/inventory.types";

function formatCurrency(value: string) {
  return Number(value).toLocaleString("vi-VN") + " đ";
}

const STATUS_TABS: { value: InventoryStatus | undefined; label: string }[] = [
  { value: undefined, label: "Tất cả" },
  { value: "in_stock", label: "Còn hàng" },
  { value: "out_of_stock", label: "Hết hàng" },
];

export default function InventoryPage() {
  const {
    rows,
    total,
    totalValue,
    page,
    pageSize,
    setPage,
    keyword,
    setKeyword,
    status,
    setStatus,
    periodFromMonth,
    periodToMonth,
    setPeriod,
    periodFrom,
    periodTo,
    loading,
    error,
    refetch,
  } = useInventoryList();

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [addingProduct, setAddingProduct] = useState(false);

  async function handleExport() {
    setExporting(true);
    setExportError("");
    try {
      await exportInventoryExcelApi({ keyword, status, periodFrom, periodTo });
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Xuất Excel thất bại");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Tồn kho"
        description="Báo cáo nhập - xuất - tồn theo sản phẩm và theo kỳ"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleExport} disabled={exporting || total === 0}>
              <DownloadIcon width={14} height={14} />
              {exporting ? "Đang xuất..." : "Xuất Excel"}
            </Button>
            <Button onClick={() => setAddingProduct(true)}>
              <PlusIcon width={14} height={14} />
              Thêm sản phẩm
            </Button>
          </div>
        }
      />

      {addingProduct && (
        <AddProductModal onClose={() => setAddingProduct(false)} onCreated={refetch} />
      )}

      {exportError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {exportError}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo mã hàng hoặc tên hàng..."
            className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            Từ kỳ
            <input
              type="month"
              value={periodFromMonth}
              onChange={(e) => setPeriod(e.target.value, periodToMonth)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            Đến kỳ
            <input
              type="month"
              value={periodToMonth}
              onChange={(e) => setPeriod(periodFromMonth, e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          {(periodFromMonth || periodToMonth) && (
            <Button variant="secondary" onClick={() => setPeriod("", "")}>
              Xóa kỳ
            </Button>
          )}
        </div>

        <div className="flex flex-col items-end justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
          <span className="text-xs font-medium text-slate-500">Tổng tiền hàng tồn</span>
          <span className="text-lg font-semibold text-blue-600">{formatCurrency(totalValue)}</span>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
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
      </div>

      <Card>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">Đang tải...</div>
        ) : error ? (
          <div className="px-5 py-10 text-center text-sm text-red-600">{error}</div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<BoxIcon width={22} height={22} />}
            title="Chưa có sản phẩm tồn kho"
            description="Sản phẩm sẽ xuất hiện tại đây sau khi có hóa đơn đầu vào được nạp."
          />
        ) : (
          <>
            <InventoryTable rows={rows} startIndex={(page - 1) * pageSize} onChanged={refetch} />
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
