"use client";

import { Fragment, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { ChevronRightIcon, DownloadIcon } from "@/shared/ui/icons";
import { ReconciliationInvoiceDetail } from "./ReconciliationInvoiceDetail";
import { exportReconciliationInvoiceApi } from "../services/reconciliation.api";
import type { ReconciliationInvoiceRow, ReconciliationStatus } from "../types/reconciliation.types";

function formatCurrency(value: string) {
  return Number(value).toLocaleString("vi-VN") + " đ";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}

const STATUS_LABEL: Record<ReconciliationStatus, string> = {
  completed: "Hoàn thành",
  negative_stock: "Âm kho",
};

const STATUS_CLASS: Record<ReconciliationStatus, string> = {
  completed: "bg-emerald-50 text-emerald-600",
  negative_stock: "bg-red-100 text-red-700",
};

export function ReconciliationTable({
  rows,
  startIndex = 0,
  onChanged,
}: {
  rows: ReconciliationInvoiceRow[];
  startIndex?: number;
  onChanged: () => void;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [exportingId, setExportingId] = useState<number | null>(null);
  const [exportError, setExportError] = useState("");

  async function handleExport(row: ReconciliationInvoiceRow) {
    setExportingId(row.id);
    setExportError("");
    try {
      await exportReconciliationInvoiceApi(row.id, row.invoiceNo);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Xuất Excel thất bại");
    } finally {
      setExportingId(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      {exportError && (
        <div className="m-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {exportError}
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase text-slate-500">
            <th className="px-5 py-3">STT</th>
            <th className="px-5 py-3">Số hóa đơn</th>
            <th className="px-5 py-3">Ký hiệu</th>
            <th className="px-5 py-3">Ngày lập</th>
            <th className="px-5 py-3">Đối tác</th>
            <th className="px-5 py-3 text-right">Tổng tiền</th>
            <th className="px-5 py-3">Trạng thái</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const isOpen = expandedId === row.id;

            return (
              <Fragment key={row.id}>
                <tr className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-3 text-slate-400">{startIndex + index + 1}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">{row.invoiceNo}</td>
                  <td className="px-5 py-3 text-slate-500">{row.invoiceSeries || "-"}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(row.issuedAt)}</td>
                  <td className="px-5 py-3 text-slate-700">{row.partnerName}</td>
                  <td className="px-5 py-3 text-right text-slate-800">
                    {formatCurrency(row.totalAmount)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[row.status]}`}
                    >
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setExpandedId(isOpen ? null : row.id)}
                      >
                        Chi tiết
                        <ChevronRightIcon
                          width={14}
                          height={14}
                          className={`transition-transform ${isOpen ? "rotate-90" : ""}`}
                        />
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleExport(row)}
                        disabled={exportingId === row.id}
                      >
                        <DownloadIcon width={14} height={14} />
                        {exportingId === row.id ? "Đang xuất..." : "Xuất Excel"}
                      </Button>
                    </div>
                  </td>
                </tr>

                {isOpen && (
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td colSpan={8} className="px-5 py-4">
                      <ReconciliationInvoiceDetail row={row} onSaved={onChanged} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
