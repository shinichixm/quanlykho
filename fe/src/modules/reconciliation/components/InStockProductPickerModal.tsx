"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import type { InStockProduct } from "../types/reconciliation.types";

const PAGE_SIZE = 5;

function formatQty(value: string) {
  return Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 0 });
}

export function InStockProductPickerModal({
  products,
  onAdd,
  onClose,
}: {
  products: InStockProduct[];
  onAdd: (product: InStockProduct, quantity: number) => void;
  onClose: () => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [quantities, setQuantities] = useState<Record<number, string>>({});

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(kw) || p.code.toLowerCase().includes(kw)
    );
  }, [products, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleKeywordChange(value: string) {
    setKeyword(value);
    setPage(1);
  }

  function handleAdd(product: InStockProduct) {
    const qty = Number(quantities[product.id]);
    if (!qty || qty <= 0) return;
    onAdd(product, qty);
    setQuantities((prev) => ({ ...prev, [product.id]: "" }));
  }

  return (
    <Modal title="Chọn sản phẩm còn hàng" onClose={onClose}>
      <input
        type="text"
        value={keyword}
        onChange={(e) => handleKeywordChange(e.target.value)}
        placeholder="Tìm theo tên hoặc mã hàng..."
        className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
        autoFocus
      />

      {pageRows.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">Không tìm thấy sản phẩm nào</div>
      ) : (
        <div className="flex flex-col gap-2">
          {pageRows.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-800">{product.name}</div>
                <div className="text-xs text-slate-400">
                  {product.code} · Tồn{" "}
                  <span className="text-base font-bold text-slate-700">
                    {formatQty(product.stockQty)}
                  </span>{" "}
                  {product.unit}
                </div>
              </div>
              <input
                type="number"
                min="0"
                step="any"
                value={quantities[product.id] ?? ""}
                onChange={(e) =>
                  setQuantities((prev) => ({ ...prev, [product.id]: e.target.value }))
                }
                placeholder="SL"
                className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
              <Button onClick={() => handleAdd(product)}>Thêm</Button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Trang {currentPage}/{totalPages} ({filtered.length} sản phẩm)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              Trước
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
