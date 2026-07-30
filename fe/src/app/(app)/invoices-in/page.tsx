"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Pagination } from "@/shared/ui/Pagination";
import { Button } from "@/shared/ui/Button";
import { InboxDownIcon, TrashIcon } from "@/shared/ui/icons";
import { useInvoiceList } from "@/modules/invoice/hooks/useInvoiceList";
import { useInvoicePartners } from "@/modules/invoice/hooks/useInvoicePartners";
import { useInvoiceImport } from "@/modules/invoice/hooks/useInvoiceImport";
import { InvoiceFilePicker } from "@/modules/invoice/components/InvoiceFilePicker";
import { InvoicePreviewPanel } from "@/modules/invoice/components/InvoicePreviewPanel";
import { InvoiceTable } from "@/modules/invoice/components/InvoiceTable";
import { InvoiceDateFilter } from "@/modules/invoice/components/InvoiceDateFilter";
import { deleteInvoiceApi, deleteInvoicesBulkApi } from "@/modules/invoice/services/invoice.api";
import type { InvoiceListItem } from "@/modules/invoice/types/invoice.types";

function formatCurrency(value: string) {
  return Number(value).toLocaleString("vi-VN") + " đ";
}

export default function InvoicesInPage() {
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
    productKeyword,
    setProductKeyword,
    loading,
    error,
    refetch,
  } = useInvoiceList("purchase");
  const partners = useInvoicePartners("purchase");
  const {
    previewRows,
    loadingPreview,
    previewError,
    confirming,
    confirmError,
    selectFiles,
    cancel,
    confirm,
  } = useInvoiceImport("purchase", refetch);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function toggleRow(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    setSelectedIds((prev) =>
      rows.every((row) => prev.includes(row.id)) ? [] : rows.map((row) => row.id)
    );
  }

  async function handleDeleteRow(row: InvoiceListItem) {
    if (!window.confirm(`Xóa hóa đơn ${row.invoiceNo}? Thao tác này sẽ hoàn tác tồn kho liên quan.`)) {
      return;
    }
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
    if (!window.confirm(`Xóa ${selectedIds.length} hóa đơn đã chọn? Thao tác này sẽ hoàn tác tồn kho liên quan.`)) {
      return;
    }
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
        title="Hóa đơn đầu vào"
        description="Danh sách hóa đơn mua vào — mỗi hóa đơn sẽ tự động sinh phiếu nhập kho"
        actions={
          <>
            {selectedIds.length > 0 && (
              <Button variant="danger" onClick={handleDeleteSelected} disabled={deleting}>
                <TrashIcon width={14} height={14} />
                Xóa đã chọn ({selectedIds.length})
              </Button>
            )}
            <InvoiceFilePicker onSelect={selectFiles} loading={loadingPreview} />
          </>
        }
      />

      {previewError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {previewError}
        </div>
      )}

      {deleteError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {deleteError}
        </div>
      )}

      {previewRows && (
        <InvoicePreviewPanel
          rows={previewRows}
          confirming={confirming}
          confirmError={confirmError}
          onCancel={cancel}
          onConfirm={confirm}
        />
      )}

      <div className="mb-4">
        <input
          type="text"
          value={productKeyword}
          onChange={(e) => setProductKeyword(e.target.value)}
          placeholder="Tìm sản phẩm trong hóa đơn theo mã hoặc tên hàng..."
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <InvoiceDateFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onApplyDate={setDateFilter}
          partners={partners}
          partnerId={partnerId}
          onPartnerChange={setPartnerFilter}
        />
        <span className="pb-2 text-xl font-semibold text-blue-600">
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
            icon={<InboxDownIcon width={22} height={22} />}
            title="Chưa có hóa đơn đầu vào nào"
            description="Nhấn “Nạp hóa đơn XML” để tải lên hóa đơn điện tử mua vào."
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
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}
