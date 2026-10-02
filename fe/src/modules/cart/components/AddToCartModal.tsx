"use client";

import { useState } from "react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { addCartItem } from "../lib/cart-storage";

type Props = {
  product: { productId: number; code: string; name: string; unit: string; avgCost?: string };
  onClose: () => void;
};

function formatCurrency(value: number) {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 0 });
}

export function AddToCartModal({ product, onClose }: Props) {
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("0");

  function handleAdd() {
    const qty = Number(quantity);
    const price = Number(unitPrice);
    if (!qty || qty <= 0) return;

    addCartItem({
      productId: product.productId,
      code: product.code,
      name: product.name,
      unit: product.unit,
      quantity: qty,
      unitPrice: Number.isFinite(price) && price >= 0 ? price : 0,
      avgCost: product.avgCost !== undefined ? Number(product.avgCost) : undefined,
    });
    onClose();
  }

  return (
    <Modal title="Thêm vào giỏ hàng" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <div className="text-sm font-medium text-slate-800">{product.name}</div>
          <div className="text-xs text-slate-500">
            {product.code} · {product.unit}
          </div>
          {product.avgCost !== undefined && (
            <div className="mt-1 text-xs text-slate-500">
              Giá nhập: <span className="font-medium text-slate-700">{formatCurrency(Number(product.avgCost))}</span>
            </div>
          )}
        </div>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Số lượng
          <input
            type="number"
            min={0}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Đơn giá
          <input
            type="number"
            min={0}
            step="any"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleAdd} disabled={!Number(quantity) || Number(quantity) <= 0}>
            Thêm vào giỏ
          </Button>
        </div>
      </div>
    </Modal>
  );
}
