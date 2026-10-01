"use client";

import { useCallback, useEffect, useState } from "react";
import { listReconciliationInvoicesApi } from "../services/reconciliation.api";
import type { ReconciliationInvoiceRow, ReconciliationStatus } from "../types/reconciliation.types";

const PAGE_SIZE = 20;

export function useReconciliationList() {
  const [rows, setRows] = useState<ReconciliationInvoiceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatusState] = useState<ReconciliationStatus | undefined>(undefined);
  const [partnerId, setPartnerIdState] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listReconciliationInvoicesApi(status, page, PAGE_SIZE, partnerId);
      setRows(result.rows);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [status, page, partnerId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  function setStatus(nextStatus: ReconciliationStatus | undefined) {
    setPage(1);
    setStatusState(nextStatus);
  }

  function setPartnerId(nextPartnerId: number | undefined) {
    setPage(1);
    setPartnerIdState(nextPartnerId);
  }

  return {
    rows,
    total,
    page,
    pageSize: PAGE_SIZE,
    setPage,
    status,
    setStatus,
    partnerId,
    setPartnerId,
    loading,
    error,
    refetch,
  };
}
