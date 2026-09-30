"use client";

import { useMemo, useState } from "react";
import type { InventoryRow } from "../types/inventory.types";
import { AddToCartModal } from "@/modules/cart/components/AddToCartModal";
import { AdjustInventoryModal } from "./AdjustInventoryModal";
import { useCart } from "@/modules/cart/hooks/useCart";
import { deleteProductApi } from "../services/inventory.api";
import { EditIcon, PlusIcon, TrashIcon } from "@/shared/ui/icons";

function formatQty(value: string) {
  return Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 0 });
}

function formatCurrency(value: string) {
  return Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 0 });
}

const STATUS_LABEL: Record<InventoryRow["status"], string> = {
  in_stock: "Còn hàng",
  out_of_stock: "Hết hàng",
};

const STATUS_CLASS: Record<InventoryRow["status"], string> = {
  in_stock: "bg-emerald-50 text-emerald-600",
  out_of_stock: "bg-red-50 text-red-600",
};

export function InventoryTable({
  rows,
  startIndex = 0,
  onChanged,
}: {
  rows: InventoryRow[];
  startIndex?: number;
  onChanged?: () => void;
}) {
  const [cartTarget, setCartTarget] = useState<InventoryRow | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<InventoryRow | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { items: cartItems } = useCart();
  const cartProductIds = useMemo(
    () => new Set(cartItems.map((item) => item.productId)),
    [cartItems]
  );

  async function handleDelete(row: InventoryRow) {
    if (!window.confirm(`Xóa sản phẩm "${row.name}" (${row.code})?`)) return;

    setDeletingId(row.productId);
    try {
      await deleteProductApi(row.productId);
      onChanged?.();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Xóa sản phẩm thất bại");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase text-slate-500">
            <th className="px-5 py-3">STT</th>
            <th className="px-5 py-3">Mã hàng</th>
            <th className="w-[450px] px-5 py-3">Tên hàng</th>
            <th className="px-5 py-3">ĐVT</th>
            <th className="px-5 py-3 text-right">Giá nhập</th>
            <th className="px-5 py-3 text-right">SL đã nhập</th>
            <th className="px-5 py-3 text-right">SL đã bán</th>
            <th className="px-5 py-3 text-right">Tồn kho</th>
            <th className="px-5 py-3">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.productId}
              className={`border-b border-slate-100 transition-colors last:border-0 ${
                cartProductIds.has(row.productId) ? "bg-amber-50" : ""
              }`}
            >
              <td className="px-5 py-3 text-slate-400">{startIndex + index + 1}</td>
              <td className="px-5 py-3 text-slate-500">{row.code}</td>
              <td
                className="max-w-[450px] truncate px-5 py-3 font-medium text-slate-800"
                title={row.name}
              >
                {row.name}
              </td>
              <td className="px-5 py-3 text-slate-500">{row.unit}</td>
              <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(row.avgCost)}</td>
              <td className="px-5 py-3 text-right text-slate-700">{formatQty(row.inQty)}</td>
              <td className="px-5 py-3 text-right text-slate-700">
                {Number(row.outQty) > 0 ? formatQty(row.outQty) : "-"}
              </td>
              <td className="px-5 py-3 text-right font-semibold text-slate-900">
                {formatQty(row.closingQty)}
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[row.status]}`}
                  >
                    {STATUS_LABEL[row.status]}
                  </span>
                  <button
                    type="button"
                    title="Thêm vào giỏ hàng"
                    onClick={() => setCartTarget(row)}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600"
                  >
                    <PlusIcon width={12} height={12} />
                  </button>
                  <button
                    type="button"
                    title="Điều chỉnh tồn kho / giá"
                    onClick={() => setAdjustTarget(row)}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600"
                  >
                    <EditIcon width={12} height={12} />
                  </button>
                  <button
                    type="button"
                    title="Xóa sản phẩm"
                    onClick={() => handleDelete(row)}
                    disabled={deletingId === row.productId}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-red-400 hover:text-red-600 disabled:opacity-50"
                  >
                    <TrashIcon width={12} height={12} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {cartTarget && (
        <AddToCartModal
          product={{
            productId: cartTarget.productId,
            code: cartTarget.code,
            name: cartTarget.name,
            unit: cartTarget.unit,
            avgCost: cartTarget.avgCost,
          }}
          onClose={() => setCartTarget(null)}
        />
      )}

      {adjustTarget && (
        <AdjustInventoryModal
          row={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onAdjusted={() => onChanged?.()}
        />
      )}
    </div>
  );
}
