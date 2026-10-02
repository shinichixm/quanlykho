"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Button } from "@/shared/ui/Button";
import { CartIcon, TrashIcon, DownloadIcon } from "@/shared/ui/icons";
import { useCart } from "@/modules/cart/hooks/useCart";
import { ExportInvoiceModal } from "@/modules/cart/components/ExportInvoiceModal";
import { getProductAvgCostsApi } from "@/modules/inventory/services/inventory.api";

function formatCurrency(value: number) {
  return value.toLocaleString("vi-VN");
}

export default function CartPage() {
  const { items, updateItem, removeItem, clear } = useCart();
  const [showExport, setShowExport] = useState(false);
  const [notice, setNotice] = useState("");
  const [avgCosts, setAvgCosts] = useState<Record<number, string>>({});

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  // Lấy giá nhập bình quân hiện tại (không chụp nhanh) để luôn khớp với Tồn kho,
  // kể cả khi sản phẩm được thêm vào giỏ từ trước và giá nhập đã thay đổi.
  useEffect(() => {
    const productIds = items.map((item) => item.productId);
    if (productIds.length === 0) {
      setAvgCosts({});
      return;
    }

    let cancelled = false;
    getProductAvgCostsApi(productIds)
      .then((data) => {
        if (!cancelled) setAvgCosts(data);
      })
      .catch(() => {
        if (!cancelled) setAvgCosts({});
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((item) => item.productId).join(",")]);

  function handleExported() {
    setShowExport(false);
    clear();
    setNotice("Đã xuất hóa đơn và làm trống giỏ hàng.");
  }

  return (
    <div>
      <PageHeader
        title="Giỏ hàng"
        description="Chọn sản phẩm từ Tồn kho, sau đó xuất hóa đơn cho khách hàng"
        actions={
          <div className="flex gap-2">
            {items.length > 0 && (
              <Button variant="secondary" onClick={clear}>
                <TrashIcon width={14} height={14} />
                Xóa giỏ hàng
              </Button>
            )}
            <Button onClick={() => setShowExport(true)} disabled={items.length === 0}>
              <DownloadIcon width={14} height={14} />
              Xuất hóa đơn
            </Button>
          </div>
        }
      />

      {notice && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
          {notice}
        </div>
      )}

      <Card>
        {items.length === 0 ? (
          <EmptyState
            icon={<CartIcon width={22} height={22} />}
            title="Giỏ hàng trống"
            description="Vào trang Tồn kho, bấm nút Thêm ở cột Trạng thái để thêm sản phẩm vào giỏ hàng."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase text-slate-500">
                  <th className="px-5 py-3">Mã hàng</th>
                  <th className="px-5 py-3">Tên hàng</th>
                  <th className="px-5 py-3">ĐVT</th>
                  <th className="px-5 py-3 text-right">Số lượng</th>
                  <th className="px-5 py-3 text-right">Giá nhập</th>
                  <th className="px-5 py-3 text-right">Đơn giá</th>
                  <th className="px-5 py-3 text-right">Thành tiền</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productId} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3 text-slate-500">{item.code}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{item.name}</td>
                    <td className="px-5 py-3 text-slate-500">{item.unit}</td>
                    <td className="px-5 py-3 text-right">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.productId, { quantity: Number(e.target.value) || 0 })
                        }
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm"
                      />
                    </td>
                    <td className="px-5 py-3 text-right text-slate-500">
                      {item.productId in avgCosts
                        ? formatCurrency(Number(avgCosts[item.productId]))
                        : "..."}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(item.productId, { unitPrice: Number(e.target.value) || 0 })
                        }
                        className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm"
                      />
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Xóa khỏi giỏ hàng"
                      >
                        <TrashIcon width={16} height={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} className="px-5 py-3 text-right text-sm font-medium text-slate-500">
                    Tổng cộng
                  </td>
                  <td className="px-5 py-3 text-right text-lg font-semibold text-blue-600">
                    {formatCurrency(total)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {showExport && (
        <ExportInvoiceModal
          items={items}
          onClose={() => setShowExport(false)}
          onExported={handleExported}
        />
      )}
    </div>
  );
}
