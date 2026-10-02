"use client";

import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import type { ProductImportPreviewRow, ProductImportResultRow } from "../services/inventory.api";

function formatCurrency(value: number) {
  return Math.ceil(value).toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " đ";
}

function formatQty(value: number) {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 3 });
}

export function ProductImportPanel({
  rows,
  confirming,
  confirmError,
  confirmResults,
  onCancel,
  onConfirm,
}: {
  rows: ProductImportPreviewRow[];
  confirming: boolean;
  confirmError: string;
  confirmResults: ProductImportResultRow[] | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const validCount = rows.filter((r) => !r.error).length;
  const done = confirmResults !== null;
  const successCount = confirmResults?.filter((r) => r.success).length ?? 0;

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-800">
          {done
            ? `Đã nhập ${successCount}/${rows.length} sản phẩm`
            : `Xem trước ${rows.length} dòng (${validCount} hợp lệ)`}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={confirming}>
            {done ? "Đóng" : "Hủy"}
          </Button>
          {!done && (
            <Button onClick={onConfirm} disabled={confirming || validCount === 0}>
              {confirming ? "Đang nhập..." : `Xác nhận nhập ${validCount} sản phẩm`}
            </Button>
          )}
        </div>
      </div>

      <div className="px-5 py-4">
        {confirmError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {confirmError}
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase text-slate-400">
              <th className="px-3 py-2">Dòng</th>
              <th className="px-3 py-2">Tên hàng</th>
              <th className="px-3 py-2">ĐVT</th>
              <th className="px-3 py-2 text-right">Giá nhập</th>
              <th className="px-3 py-2 text-right">SL</th>
              <th className="px-3 py-2">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const result = confirmResults?.find((r) => r.rowIndex === row.rowIndex);

              return (
                <tr key={row.rowIndex} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 text-slate-400">{row.rowIndex}</td>
                  <td className="px-3 py-2 text-slate-700">{row.name || "-"}</td>
                  <td className="px-3 py-2 text-slate-500">{row.unit || "-"}</td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {formatCurrency(row.unitPrice)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">{formatQty(row.quantity)}</td>
                  <td className="px-3 py-2">
                    {result ? (
                      result.success ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                          Đã nhập{result.created ? " (sản phẩm mới)" : " (cộng vào sản phẩm có sẵn)"}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                          Lỗi: {result.error}
                        </span>
                      )
                    ) : row.error ? (
                      <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                        {row.error}
                      </span>
                    ) : row.existingProductId ? (
                      <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Gộp vào {row.existingProductCode}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                        Tạo mới
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
