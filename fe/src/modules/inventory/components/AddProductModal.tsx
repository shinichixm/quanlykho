"use client";

import { useState } from "react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { createProductApi } from "../services/inventory.api";

export function AddProductModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = code.trim() && name.trim() && unit.trim() && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSaving(true);
    setError("");
    try {
      await createProductApi({ code: code.trim(), name: name.trim(), unit: unit.trim() });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thêm sản phẩm thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Thêm sản phẩm" onClose={onClose}>
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Mã hàng
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Tên hàng
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Đơn vị tính
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Cái, kg, thùng..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {saving ? "Đang lưu..." : "Thêm sản phẩm"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
