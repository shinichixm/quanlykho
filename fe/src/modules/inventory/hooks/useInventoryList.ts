"use client";

import { useCallback, useEffect, useState } from "react";
import { listInventoryApi } from "../services/inventory.api";
import type { InventoryRow, InventoryStatus } from "../types/inventory.types";

const PAGE_SIZE = 20;

export function useInventoryList() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeywordState] = useState("");
  const [status, setStatusState] = useState<InventoryStatus | undefined>(undefined);
  const [periodFromMonth, setPeriodFromMonth] = useState("");
  const [periodToMonth, setPeriodToMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const periodFrom = monthToStartDate(periodFromMonth);
  const periodTo = monthToEndDate(periodToMonth);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listInventoryApi(
        { keyword, status, periodFrom, periodTo },
        page,
        PAGE_SIZE
      );
      setRows(result.rows);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [keyword, page, status, periodFrom, periodTo]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  function setKeyword(nextKeyword: string) {
    setPage(1);
    setKeywordState(nextKeyword);
  }

  function setStatus(nextStatus: InventoryStatus | undefined) {
    setPage(1);
    setStatusState(nextStatus);
  }

  function setPeriod(nextFromMonth: string, nextToMonth: string) {
    setPage(1);
    setPeriodFromMonth(nextFromMonth);
    setPeriodToMonth(nextToMonth);
  }

  return {
    rows,
    total,
    page,
    pageSize: PAGE_SIZE,
    setPage,
    keyword,
    setKeyword,
    status,
    setStatus,
    periodFromMonth,
    periodToMonth,
    setPeriod,
    periodFrom,
    periodTo,
    loading,
    error,
    refetch,
  };
}

// input type="month" trả về "YYYY-MM" — quy đổi thành ngày đầu/cuối tháng dạng "YYYY-MM-DD".
function monthToStartDate(month: string): string | undefined {
  if (!month) return undefined;
  return `${month}-01`;
}

function monthToEndDate(month: string): string | undefined {
  if (!month) return undefined;
  const [year, mon] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  return `${month}-${String(lastDay).padStart(2, "0")}`;
}
