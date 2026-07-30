"use client";

import { useState } from "react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { createCustomerApi, updateCustomerApi } from "../services/customer.api";
import type { CustomerRow } from "../types/customer.types";

type Props = {
  customer?: CustomerRow | null;
  onClose: () => void;
  onSaved: () => void;
};

export function CustomerFormModal({ customer, onClose, onSaved }: Props) {
  const [name, setName] = useState(customer?.name || "");
  const [taxCode, setTaxCode] = useState(customer?.taxCode || "");
  const [address, setAddress] = useState(customer?.address || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) {
      setError("Tên khách hàng không được để trống");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const input = {
        name: name.trim(),
        taxCode: taxCode.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
      };
      if (customer) {
        await updateCustomerApi(customer.id, input);
      } else {
        await createCustomerApi(input);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu khách hàng thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={customer ? "Sửa khách hàng" : "Thêm khách hàng"} onClose={onClose}>
      <div className="space-y-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Tên khách hàng *
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Mã số thuế
          <input
            type="text"
            value={taxCode}
            onChange={(e) => setTaxCode(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Địa chỉ
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Số điện thoại
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
        </label>

        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
