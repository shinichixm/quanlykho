"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { exportCartInvoiceApi } from "../services/cart.api";
import { searchCustomerApi } from "@/modules/customer/services/customer.api";
import type { CustomerRow } from "@/modules/customer/types/customer.types";
import type { CartItem } from "../types/cart.types";

type Props = {
  items: CartItem[];
  onClose: () => void;
  onExported: () => void;
};

export function ExportInvoiceModal({ items, onClose, onExported }: Props) {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [keyword, setKeyword] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    searchCustomerApi({ page: 1, pageSize: 200 })
      .then((result) => setCustomers(result.rows))
      .catch(() => setCustomers([]))
      .finally(() => setLoadingCustomers(false));
  }, []);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(kw) ||
        (c.taxCode || "").toLowerCase().includes(kw)
    );
  }, [customers, keyword]);

  function handleSelect(customer: CustomerRow) {
    setSelectedCustomer(customer);
    setKeyword(customer.name);
    setShowResults(false);
  }

  function handleKeywordChange(value: string) {
    setKeyword(value);
    setShowResults(true);
    if (selectedCustomer && value !== selectedCustomer.name) {
      setSelectedCustomer(null);
    }
  }

  async function handleExport() {
    if (!selectedCustomer) {
      setError("Vui lòng chọn khách hàng");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await exportCartInvoiceApi(
        {
          name: selectedCustomer.name,
          taxCode: selectedCustomer.taxCode || "",
          address: selectedCustomer.address || "",
        },
        items
      );
      onExported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xuất hóa đơn thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Xuất hóa đơn" onClose={onClose}>
      <div className="space-y-4">
        {loadingCustomers ? (
          <div className="text-sm text-slate-400">Đang tải danh sách khách hàng...</div>
        ) : customers.length === 0 ? (
          <div className="rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-700">
            Chưa có khách hàng nào được khai báo.{" "}
            <Link href="/customers" className="font-medium underline" onClick={onClose}>
              Thêm khách hàng
            </Link>{" "}
            trước khi xuất hóa đơn.
          </div>
        ) : (
          <div className="relative">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
              Khách hàng *
              <input
                type="text"
                value={keyword}
                onChange={(e) => handleKeywordChange(e.target.value)}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 150)}
                placeholder="Tìm theo tên hoặc mã số thuế..."
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                autoFocus
                autoComplete="off"
              />
            </label>

            {showResults && (
              <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {filtered.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-slate-400">
                    Không tìm thấy khách hàng phù hợp
                  </div>
                ) : (
                  filtered.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => handleSelect(c)}
                      className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <span className="font-medium text-slate-800">{c.name}</span>
                      {c.taxCode && <span className="text-xs text-slate-400">{c.taxCode}</span>}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {selectedCustomer && (
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <div>Mã số thuế: {selectedCustomer.taxCode || "-"}</div>
            <div>Địa chỉ: {selectedCustomer.address || "-"}</div>
          </div>
        )}

        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleExport} disabled={loading || !selectedCustomer}>
            {loading ? "Đang xuất..." : "Xuất Excel"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
