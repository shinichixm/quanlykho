"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { SearchableSelect } from "@/shared/ui/SearchableSelect";
import type { InvoicePartnerOption } from "../types/invoice.types";

type Props = {
  dateFrom: string;
  dateTo: string;
  onApplyDate: (dateFrom: string, dateTo: string) => void;
  partners: InvoicePartnerOption[];
  partnerId: number | undefined;
  onPartnerChange: (partnerId: number | undefined) => void;
};

export function InvoiceDateFilter({
  dateFrom,
  dateTo,
  onApplyDate,
  partners,
  partnerId,
  onPartnerChange,
}: Props) {
  const [from, setFrom] = useState(dateFrom);
  const [to, setTo] = useState(dateTo);

  function handleApply() {
    onApplyDate(from, to);
  }

  function handleClear() {
    setFrom("");
    setTo("");
    onApplyDate("", "");
    onPartnerChange(undefined);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Từ ngày
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Đến ngày
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Công ty
        <SearchableSelect
          options={partners}
          value={partnerId}
          onChange={onPartnerChange}
          getLabel={(partner) => partner.name}
          getValue={(partner) => partner.id}
          placeholder="Tất cả công ty"
          className="min-w-[260px]"
        />
      </label>
      <Button variant="secondary" onClick={handleApply}>
        Lọc
      </Button>
      {(dateFrom || dateTo || partnerId) && (
        <Button variant="secondary" onClick={handleClear}>
          Xóa lọc
        </Button>
      )}
    </div>
  );
}
