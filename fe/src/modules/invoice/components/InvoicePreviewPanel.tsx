"use client";

import { useMemo, useState } from "react";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { BuildingIcon, ChevronRightIcon, TrashIcon } from "@/shared/ui/icons";
import type { PreviewInvoiceRow } from "../types/invoice.types";

function formatCurrency(value: number | null) {
  if (value == null) return "-";
  return value.toLocaleString("vi-VN") + " đ";
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
}

type PartnerGroup = {
  key: string;
  partnerName: string;
  partnerTaxCode: string | null;
  invoices: PreviewInvoiceRow[];
};

function groupByPartner(rows: PreviewInvoiceRow[]) {
  const valid = rows.filter((r) => !r.error);
  const invalid = rows.filter((r) => r.error);

  const groups = new Map<string, PartnerGroup>();
  for (const row of valid) {
    const key = row.partnerTaxCode || row.partnerName || row.fileName;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        partnerName: row.partnerName || "Không rõ",
        partnerTaxCode: row.partnerTaxCode,
        invoices: [],
      });
    }
    groups.get(key)!.invoices.push(row);
  }

  return { groups: Array.from(groups.values()), invalid };
}

export function InvoicePreviewPanel({
  rows,
  confirming,
  confirmError,
  onCancel,
  onConfirm,
  onRemove,
}: {
  rows: PreviewInvoiceRow[];
  confirming: boolean;
  confirmError: string;
  onCancel: () => void;
  onConfirm: () => void;
  onRemove: (fileName: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { groups, invalid } = useMemo(() => groupByPartner(rows), [rows]);
  const validCount = rows.length - invalid.length;

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-800">
          Xem trước {rows.length} hóa đơn
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={confirming}>
            Hủy
          </Button>
          <Button onClick={onConfirm} disabled={confirming || validCount === 0}>
            {confirming ? "Đang lưu..." : `Xác nhận nạp ${validCount} hóa đơn`}
          </Button>
        </div>
      </div>

      <div className="px-5 py-4">
        {confirmError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {confirmError}
          </div>
        )}

        {invalid.length > 0 && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            <div className="font-medium">{invalid.length} file không đọc được:</div>
            <ul className="mt-1 flex flex-col gap-1">
              {invalid.map((row) => (
                <li key={row.fileName} className="flex items-center justify-between gap-2">
                  <span>
                    {row.fileName}: {row.error}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(row.fileName)}
                    title="Bỏ file này khỏi danh sách nạp"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-red-200 text-red-500 hover:bg-red-100"
                  >
                    <TrashIcon width={12} height={12} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.key}>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <BuildingIcon width={16} height={16} className="text-slate-400" />
                {group.partnerName}
                {group.partnerTaxCode ? (
                  <span className="font-normal text-slate-400">
                    MST: {group.partnerTaxCode}
                  </span>
                ) : (
                  <span className="font-normal text-amber-600">Không MST</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {group.invoices.map((invoice) => {
                  const key = invoice.fileName;
                  const isOpen = expanded.has(key);
                  return (
                    <div
                      key={key}
                      className="overflow-hidden rounded-lg border border-slate-200"
                    >
                      <div className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-2.5 text-sm hover:bg-slate-100">
                        <button
                          type="button"
                          onClick={() => toggle(key)}
                          className="flex flex-1 items-center gap-2 text-left"
                        >
                          <ChevronRightIcon
                            width={14}
                            height={14}
                            className={`text-slate-400 transition-transform ${
                              isOpen ? "rotate-90" : ""
                            }`}
                          />
                          <span className="font-medium text-slate-800">
                            Hóa đơn {invoice.invoiceNo}
                            {invoice.invoiceSeries ? ` / ${invoice.invoiceSeries}` : ""}
                          </span>
                          <span className="text-slate-400">
                            {formatDate(invoice.issuedAt)}
                          </span>
                        </button>
                        <div className="flex items-center gap-3 text-slate-500">
                          <span>{invoice.items.length} mặt hàng</span>
                          <span className="font-medium text-slate-800">
                            {formatCurrency(invoice.totalAmount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemove(invoice.fileName)}
                            title="Bỏ hóa đơn này khỏi danh sách nạp"
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-400 hover:border-red-400 hover:text-red-600"
                          >
                            <TrashIcon width={12} height={12} />
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-t border-slate-100 text-left text-xs font-medium uppercase text-slate-400">
                              <th className="px-4 py-2">Tên hàng</th>
                              <th className="px-4 py-2">ĐVT</th>
                              <th className="px-4 py-2 text-right">SL</th>
                              <th className="px-4 py-2 text-right">Đơn giá</th>
                              <th className="px-4 py-2 text-right">Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoice.items.map((item, idx) => (
                              <tr key={idx} className="border-t border-slate-100">
                                <td className="px-4 py-2 text-slate-700">{item.name}</td>
                                <td className="px-4 py-2 text-slate-500">{item.unit}</td>
                                <td className="px-4 py-2 text-right text-slate-700">
                                  {item.quantity.toLocaleString("vi-VN")}
                                </td>
                                <td className="px-4 py-2 text-right text-slate-700">
                                  {formatCurrency(item.unitPrice)}
                                </td>
                                <td className="px-4 py-2 text-right text-slate-800">
                                  {formatCurrency(item.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
