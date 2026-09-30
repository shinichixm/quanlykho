"use client";

import { useState } from "react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { adjustInventoryApi } from "../services/inventory.api";
import type { InventoryRow } from "../types/inventory.types";

function formatQty(value: number) {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 3 });
}

export function AdjustInventoryModal({
  row,
  onClose,
  onAdjusted,
}: {
  row: InventoryRow;
  onClose: () => void;
  onAdjusted: () => void;
}) {
  const currentQty = Number(row.closingQty);
  const currentAvgCost = Number(row.avgCost);

  const [actualQty, setActualQty] = useState(String(currentQty));
  const [unitPrice, setUnitPrice] = useState(String(currentAvgCost));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const parsedQty = Number(actualQty);
  const parsedPrice = Number(unitPrice);
  const delta = Number.isFinite(parsedQty) ? parsedQty - currentQty : 0;
  const canSubmit =
    !saving &&
    actualQty.trim() !== "" &&
    Number.isFinite(parsedQty) &&
    Number.isFinite(parsedPrice) &&
    parsedPrice >= 0 &&
    delta !== 0;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSaving(true);
    setError("");
    try {
      await adjustInventoryApi({
        productId: row.productId,
        quantity: delta,
        unitPrice: parsedPrice,
        note: note.trim() || undefined,
      });
      onAdjusted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Điều chỉnh tồn kho thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Điều chỉnh tồn kho" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <div className="text-sm font-medium text-slate-800">{row.name}</div>
          <div className="text-xs text-slate-500">
            {row.code} · {row.unit} · Đang tồn:{" "}
            <span className="font-medium text-slate-700">{formatQty(currentQty)}</span> · Giá vốn
            b.quân: <span className="font-medium text-slate-700">{formatQty(currentAvgCost)}</span>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Số lượng tồn kho thực tế
          <input
            type="number"
            step="any"
            value={actualQty}
            onChange={(e) => setActualQty(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Đơn giá phần chênh lệch
          <input
            type="number"
            min={0}
            step="any"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          <span className="font-normal normal-case text-slate-400">
            Chỉ dùng để tính lại giá vốn bình quân khi tăng tồn kho.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Ghi chú / lý do (tùy chọn)
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="VD: Kiểm kê thực tế, hàng hỏng..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
        </label>

        {delta !== 0 && Number.isFinite(delta) && (
          <div
            className={`rounded-lg px-3 py-2 text-xs font-medium ${
              delta > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            Sẽ ghi phiếu điều chỉnh: {delta > 0 ? "+" : ""}
            {formatQty(delta)} {row.unit}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {saving ? "Đang lưu..." : "Lưu điều chỉnh"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
