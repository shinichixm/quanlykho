"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Pagination } from "@/shared/ui/Pagination";
import { Button } from "@/shared/ui/Button";
import { ReceiptIcon, TrashIcon } from "@/shared/ui/icons";
import { useInvoiceList } from "@/modules/invoice/hooks/useInvoiceList";
import { useInvoicePartners } from "@/modules/invoice/hooks/useInvoicePartners";
import { InvoiceTable } from "@/modules/invoice/components/InvoiceTable";
import { InvoiceDateFilter } from "@/modules/invoice/components/InvoiceDateFilter";
import { deleteInvoiceApi, deleteInvoicesBulkApi } from "@/modules/invoice/services/invoice.api";
import type { InvoiceListItem } from "@/modules/invoice/types/invoice.types";

function formatCurrency(value: string) {
  return Number(value).toLocaleString("vi-VN") + " đ";
}

export default function ExpensesPage() {
  const {
    rows,
    total,
    totalAmountSum,
    page,
    pageSize,
    setPage,
    dateFrom,
    dateTo,
    setDateFilter,
    partnerId,
    setPartnerFilter,
    loading,
    error,
    refetch,
  } = useInvoiceList("purchase", "cost");
  const partners = useInvoicePartners("purchase");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function toggleRow(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAll() {
    setSelectedIds((prev) =>
      rows.every((row) => prev.includes(row.id)) ? [] : rows.map((row) => row.id)
    );
  }

  async function handleDeleteRow(row: InvoiceListItem) {
    if (!window.confirm(`Xóa hóa đơn chi phí ${row.invoiceNo}?`)) return;

    setDeleting(true);
    setDeleteError("");
    try {
      await deleteInvoiceApi(row.id);
      setSelectedIds((prev) => prev.filter((id) => id !== row.id));
      await refetch();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Xóa hóa đơn thất bại");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteSelected() {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Xóa ${selectedIds.length} hóa đơn chi phí đã chọn?`)) return;

    setDeleting(true);
    setDeleteError("");
    try {
      await deleteInvoicesBulkApi(selectedIds);
      setSelectedIds([]);
      await refetch();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Xóa hóa đơn thất bại");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Chi phí"
        description="Hóa đơn mua vào được phân loại là chi phí khi nạp — không tạo sản phẩm, không ảnh hưởng tồn kho"
        actions={
          selectedIds.length > 0 ? (
            <Button variant="danger" onClick={handleDeleteSelected} disabled={deleting}>
              <TrashIcon width={14} height={14} />
              Xóa đã chọn ({selectedIds.length})
            </Button>
          ) : undefined
        }
      />

      {deleteError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {deleteError}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <InvoiceDateFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onApplyDate={setDateFilter}
          partners={partners}
          partnerId={partnerId}
          onPartnerChange={setPartnerFilter}
        />
        <span className="pb-2 text-xl font-semibold text-amber-600">
          Tổng tiền: {formatCurrency(totalAmountSum)}
        </span>
      </div>

      <Card>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">Đang tải...</div>
        ) : error ? (
          <div className="px-5 py-10 text-center text-sm text-red-600">{error}</div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<ReceiptIcon width={22} height={22} />}
            title="Chưa có hóa đơn chi phí nào"
            description={
              'Ở màn "Hóa đơn đầu vào", bấm nút phân loại thành "Chi phí" trên hóa đơn khi nạp để nó xuất hiện ở đây thay vì tạo sản phẩm tồn kho.'
            }
          />
        ) : (
          <>
            <InvoiceTable
              rows={rows}
              selectedIds={selectedIds}
              onToggleRow={toggleRow}
              onToggleAll={toggleAll}
              onDeleteRow={handleDeleteRow}
            />
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
