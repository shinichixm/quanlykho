"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Pagination } from "@/shared/ui/Pagination";
import { Button } from "@/shared/ui/Button";
import { BuildingIcon, PlusIcon, TrashIcon } from "@/shared/ui/icons";
import { useCustomerList } from "@/modules/customer/hooks/useCustomerList";
import { CustomerFormModal } from "@/modules/customer/components/CustomerFormModal";
import { deleteCustomerApi } from "@/modules/customer/services/customer.api";
import type { CustomerRow } from "@/modules/customer/types/customer.types";

export default function CustomersPage() {
  const { rows, total, page, pageSize, setPage, keyword, setKeyword, loading, error, refetch } =
    useCustomerList();
  const [editing, setEditing] = useState<CustomerRow | null | undefined>(undefined);
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete(row: CustomerRow) {
    if (!window.confirm(`Xóa khách hàng "${row.name}"?`)) return;
    setDeleteError("");
    try {
      await deleteCustomerApi(row.id);
      refetch();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Xóa khách hàng thất bại");
    }
  }

  return (
    <div>
      <PageHeader
        title="Khách hàng"
        description="Khai báo khách hàng để chọn nhanh khi xuất hóa đơn từ Giỏ hàng"
        actions={
          <Button onClick={() => setEditing(null)}>
            <PlusIcon width={14} height={14} />
            Thêm khách hàng
          </Button>
        }
      />

      {deleteError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{deleteError}</div>
      )}

      <div className="mb-4">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo tên hoặc mã số thuế..."
          className="w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
        />
      </div>

      <Card>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">Đang tải...</div>
        ) : error ? (
          <div className="px-5 py-10 text-center text-sm text-red-600">{error}</div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<BuildingIcon width={22} height={22} />}
            title="Chưa có khách hàng"
            description="Thêm khách hàng để chọn nhanh khi xuất hóa đơn từ Giỏ hàng."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase text-slate-500">
                    <th className="px-5 py-3">Tên khách hàng</th>
                    <th className="px-5 py-3">Mã số thuế</th>
                    <th className="px-5 py-3">Địa chỉ</th>
                    <th className="px-5 py-3">Điện thoại</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-5 py-3 font-medium text-slate-800">{row.name}</td>
                      <td className="px-5 py-3 text-slate-500">{row.taxCode || "-"}</td>
                      <td className="px-5 py-3 text-slate-500">{row.address || "-"}</td>
                      <td className="px-5 py-3 text-slate-500">{row.phone || "-"}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditing(row)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Xóa khách hàng"
                          >
                            <TrashIcon width={16} height={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          </>
        )}
      </Card>

      {editing !== undefined && (
        <CustomerFormModal
          customer={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            refetch();
          }}
        />
      )}
    </div>
  );
}
