"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { useInStockProducts } from "../hooks/useInStockProducts";
import { deleteSubstitutionApi, saveInvoiceSubstitutionsApi } from "../services/reconciliation.api";
import { InStockProductPickerModal } from "./InStockProductPickerModal";
import type { InStockProduct, ReconciliationInvoiceRow } from "../types/reconciliation.types";

function formatQty(value: string) {
  return Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 0 });
}

type LocalEntry = {
  key: string;
  // Chỉ có khi phiếu đã được lưu trên server (khác với phiếu mới thêm tại chỗ,
  // chưa bấm Lưu tạm/Hoàn thành) — dùng để biết phải gọi API xóa thật hay chỉ
  // bỏ khỏi state cục bộ.
  substitutionId?: number;
  invoiceItemId: number;
  substituteProductId: number;
  substituteProductCode: string;
  substituteProductName: string;
  quantity: number;
};

function buildInitialEntries(row: ReconciliationInvoiceRow): LocalEntry[] {
  return row.items.flatMap((item) =>
    item.substitutions.map((sub) => ({
      key: `saved-${sub.id}`,
      substitutionId: sub.id,
      invoiceItemId: item.invoiceItemId,
      substituteProductId: sub.substituteProductId,
      substituteProductCode: sub.substituteProductCode,
      substituteProductName: sub.substituteProductName,
      quantity: Number(sub.quantity),
    }))
  );
}

export function ReconciliationInvoiceDetail({
  row,
  onSaved,
}: {
  row: ReconciliationInvoiceRow;
  onSaved: () => void;
}) {
  const { products } = useInStockProducts();
  const [entries, setEntries] = useState<LocalEntry[]>(() => buildInitialEntries(row));
  const [pickerItemId, setPickerItemId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deletingSubId, setDeletingSubId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const isResolved = row.status === "completed";

  function openPicker(itemId: number) {
    setPickerItemId(itemId);
  }

  function addEntry(itemId: number, product: InStockProduct, qty: number) {
    setEntries((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}-${Math.random()}`,
        invoiceItemId: itemId,
        substituteProductId: product.id,
        substituteProductCode: product.code,
        substituteProductName: product.name,
        quantity: qty,
      },
    ]);
  }

  function removeEntry(key: string) {
    setEntries((prev) => prev.filter((e) => e.key !== key));
  }

  async function handleDeleteSavedEntry(substitutionId: number) {
    if (
      !window.confirm(
        "Xóa bổ sung này? Số lượng đã trừ ở sản phẩm thay thế sẽ được hoàn lại, hóa đơn có thể quay về trạng thái Âm kho."
      )
    ) {
      return;
    }

    setDeletingSubId(substitutionId);
    setDeleteError("");
    try {
      await deleteSubstitutionApi(row.id, substitutionId);
      // row prop chỉ làm mới qua onSaved() (refetch ở component cha) — entries là
      // state cục bộ, không tự đồng bộ theo prop mới, nên phải gỡ ngay tại đây để
      // UI không còn hiện phiếu vừa xóa.
      setEntries((prev) => prev.filter((e) => e.substitutionId !== substitutionId));
      onSaved();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setDeletingSubId(null);
    }
  }

  async function handleSave(action: "draft" | "complete") {
    setSaving(true);
    setSaveError("");
    try {
      await saveInvoiceSubstitutionsApi(
        row.id,
        action,
        entries.map((e) => ({
          invoiceItemId: e.invoiceItemId,
          substituteProductId: e.substituteProductId,
          quantity: e.quantity,
        }))
      );
      onSaved();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <table className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase text-slate-400">
            <th className="px-4 py-2">Mã hàng</th>
            <th className="px-4 py-2">Tên hàng</th>
            <th className="px-4 py-2">ĐVT</th>
            <th className="px-4 py-2 text-right">SL bán</th>
            <th className="px-4 py-2 text-right">Tồn sau hóa đơn</th>
            <th className="px-4 py-2">Kết quả</th>
          </tr>
        </thead>
        <tbody>
          {row.items.map((item) => {
            const itemEntries = entries.filter((e) => e.invoiceItemId === item.invoiceItemId);
            // Chỉ cần bổ sung đúng phần đang âm — phần đã có sẵn trong kho không cần bù.
            const requiredQty = Math.min(
              Number(item.quantitySold),
              Math.max(0, -Number(item.currentStock))
            );
            const substitutedQty = itemEntries.reduce((sum, e) => sum + e.quantity, 0);

            return (
              <tr key={item.invoiceItemId} className="border-b border-slate-100 last:border-0 align-top">
                <td className="px-4 py-2 text-slate-500">{item.productCode}</td>
                <td className="px-4 py-2 text-slate-700">{item.productName}</td>
                <td className="px-4 py-2 text-slate-500">{item.unit}</td>
                <td className="px-4 py-2 text-right text-slate-700">
                  {formatQty(item.quantitySold)}
                </td>
                <td className="px-4 py-2 text-right text-slate-700">
                  {formatQty(item.currentStock)}
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.ok ? (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                        Khớp kho
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                        Âm kho
                      </span>
                    )}
                    {!isResolved && !item.ok && (
                      <Button
                        variant="secondary"
                        onClick={() => openPicker(item.invoiceItemId)}
                      >
                        Bổ sung
                      </Button>
                    )}
                  </div>

                  {!item.ok && requiredQty > 0 && (
                    <div
                      className={`mt-1 text-xs ${
                        substitutedQty >= requiredQty ? "text-emerald-600" : "text-slate-500"
                      }`}
                    >
                      Cần bổ sung: {formatQty(String(requiredQty))} {item.unit} (đã bổ sung{" "}
                      {formatQty(String(substitutedQty))})
                    </div>
                  )}

                  {itemEntries.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {itemEntries.map((entry) => {
                        // Phiếu đã lưu trên server: luôn cho xóa (kể cả khi hóa đơn đã
                        // "Hoàn thành") vì xóa sẽ gọi API hoàn trả tồn kho thật. Phiếu
                        // mới thêm tại chỗ, chưa lưu: chỉ xóa khỏi state khi chưa hoàn thành.
                        const isSaved = entry.substitutionId !== undefined;
                        const canDelete = isSaved || !isResolved;
                        const isDeleting = entry.substitutionId === deletingSubId;

                        return (
                          <div
                            key={entry.key}
                            className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600"
                          >
                            <span className="flex-1">
                              {entry.substituteProductName} — SL {formatQty(String(entry.quantity))}
                            </span>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() =>
                                  isSaved
                                    ? handleDeleteSavedEntry(entry.substitutionId!)
                                    : removeEntry(entry.key)
                                }
                                disabled={isDeleting}
                                className="text-red-500 hover:text-red-700 disabled:opacity-50"
                              >
                                {isDeleting ? "Đang xóa..." : "Xóa"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {pickerItemId != null && (
        <InStockProductPickerModal
          products={products}
          onAdd={(product, qty) => addEntry(pickerItemId, product, qty)}
          onClose={() => setPickerItemId(null)}
        />
      )}

      {deleteError && (
        <div className="mt-3 text-sm text-red-600">{deleteError}</div>
      )}

      {!isResolved && (
        <div className="mt-3 flex items-center gap-2">
          {saveError && <span className="text-sm text-red-600">{saveError}</span>}
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" onClick={() => handleSave("draft")} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu tạm"}
            </Button>
            <Button onClick={() => handleSave("complete")} disabled={saving}>
              {saving ? "Đang xử lý..." : "Hoàn thành"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
