"use client";

import { Fragment, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { ChevronRightIcon, TrashIcon } from "@/shared/ui/icons";
import { getInvoiceDetailApi } from "../services/invoice.api";
import type { InvoiceDetail, InvoiceListItem } from "../types/invoice.types";

function formatCurrency(value: string) {
  const n = Number(value);
  return n.toLocaleString("vi-VN") + " đ";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}

const STATUS_LABEL: Record<string, string> = {
  new: "Mới",
  processed: "Đã xử lý",
  error: "Lỗi",
};

type DetailState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; data: InvoiceDetail };

type Props = {
  rows: InvoiceListItem[];
  selectedIds: number[];
  onToggleRow: (id: number) => void;
  onToggleAll: () => void;
  onDeleteRow: (row: InvoiceListItem) => void;
};

export function InvoiceTable({ rows, selectedIds, onToggleRow, onToggleAll, onDeleteRow }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, DetailState>>({});
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));

  async function toggleDetail(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);
    if (!details[id]) {
      setDetails((prev) => ({ ...prev, [id]: { status: "loading" } }));
      try {
        const data = await getInvoiceDetailApi(id);
        setDetails((prev) => ({ ...prev, [id]: { status: "loaded", data } }));
      } catch (err) {
        setDetails((prev) => ({
          ...prev,
          [id]: {
            status: "error",
            message: err instanceof Error ? err.message : "Không tải được chi tiết",
          },
        }));
      }
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase text-slate-500">
            <th className="w-10 px-5 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                aria-label="Chọn tất cả"
              />
            </th>
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
          {rows.map((row) => {
            const isOpen = expandedId === row.id;
            const detail = details[row.id];

            return (
              <Fragment key={row.id}>
                <tr className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => onToggleRow(row.id)}
                      aria-label={`Chọn hóa đơn ${row.invoiceNo}`}
                    />
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800">{row.invoiceNo}</td>
                  <td className="px-5 py-3 text-slate-500">{row.invoiceSeries || "-"}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(row.issuedAt)}</td>
                  <td className="px-5 py-3 text-slate-700">{row.partnerName}</td>
                  <td className="px-5 py-3 text-right text-slate-800">
                    {formatCurrency(row.totalAmount)}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                      {STATUS_LABEL[row.status] || row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="secondary" onClick={() => toggleDetail(row.id)}>
                        Chi tiết
                        <ChevronRightIcon
                          width={14}
                          height={14}
                          className={`transition-transform ${isOpen ? "rotate-90" : ""}`}
                        />
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => onDeleteRow(row)}
                        aria-label={`Xóa hóa đơn ${row.invoiceNo}`}
                      >
                        <TrashIcon width={14} height={14} />
                      </Button>
                    </div>
                  </td>
                </tr>

                {isOpen && (
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td colSpan={8} className="px-5 py-4">
                      {!detail || detail.status === "loading" ? (
                        <div className="py-4 text-center text-sm text-slate-400">
                          Đang tải chi tiết...
                        </div>
                      ) : detail.status === "error" ? (
                        <div className="py-4 text-center text-sm text-red-600">
                          {detail.message}
                        </div>
                      ) : (
                        <InvoiceDetailContent data={detail.data} />
                      )}
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

function InvoiceDetailContent({ data }: { data: InvoiceDetail }) {
  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-4">
        <div>
          <div className="text-xs text-slate-400">Đối tác</div>
          <div className="text-slate-800">{data.partner.name}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Mã số thuế</div>
          <div className="text-slate-800">{data.partner.taxCode}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Địa chỉ</div>
          <div className="text-slate-800">{data.partner.address || "-"}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Tổng tiền</div>
          <div className="font-medium text-slate-800">
            {formatCurrency(data.totalAmount)}
          </div>
        </div>
      </div>

      <table className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase text-slate-400">
            <th className="px-4 py-2">Mã hàng</th>
            <th className="px-4 py-2">Tên hàng</th>
            <th className="px-4 py-2">ĐVT</th>
            <th className="px-4 py-2 text-right">SL</th>
            <th className="px-4 py-2 text-right">Đơn giá</th>
            <th className="px-4 py-2 text-right">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => (
            <tr key={item.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-2 text-slate-500">{item.productCode}</td>
              <td className="px-4 py-2 text-slate-700">{item.productName}</td>
              <td className="px-4 py-2 text-slate-500">{item.unit}</td>
              <td className="px-4 py-2 text-right text-slate-700">
                {Number(item.quantity).toLocaleString("vi-VN")}
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
    </div>
  );
}
