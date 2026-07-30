"use client";

import { useCallback, useEffect, useState } from "react";
import { searchCustomerApi } from "../services/customer.api";
import type { CustomerRow } from "../types/customer.types";

const PAGE_SIZE = 20;

export function useCustomerList() {
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeywordState] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await searchCustomerApi({ keyword, page, pageSize: PAGE_SIZE });
      setRows(result.rows);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [keyword, page]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  function setKeyword(next: string) {
    setPage(1);
    setKeywordState(next);
  }

  return { rows, total, page, pageSize: PAGE_SIZE, setPage, keyword, setKeyword, loading, error, refetch };
}
