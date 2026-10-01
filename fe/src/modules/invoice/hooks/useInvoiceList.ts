"use client";

import { useCallback, useEffect, useState } from "react";
import { listInvoicesApi } from "../services/invoice.api";
import { INVOICE_PAGE_SIZE } from "../constants/invoice.constants";
import type { InvoiceCategory, InvoiceListItem, InvoiceType } from "../types/invoice.types";

export function useInvoiceList(type: InvoiceType, category?: InvoiceCategory) {
  const [rows, setRows] = useState<InvoiceListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAmountSum, setTotalAmountSum] = useState("0");
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [partnerId, setPartnerId] = useState<number | undefined>(undefined);
  const [productKeywordInput, setProductKeywordInput] = useState("");
  const [productKeyword, setProductKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listInvoicesApi(
        type,
        page,
        INVOICE_PAGE_SIZE,
        dateFrom,
        dateTo,
        partnerId,
        productKeyword,
        category
      );
      setRows(result.rows);
      setTotal(result.total);
      setTotalAmountSum(result.totalAmountSum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [type, category, page, dateFrom, dateTo, partnerId, productKeyword]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Debounce ô tìm sản phẩm để không gọi API liên tục theo từng ký tự gõ.
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setProductKeyword(productKeywordInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [productKeywordInput]);

  function updateDateFilter(nextFrom: string, nextTo: string) {
    setPage(1);
    setDateFrom(nextFrom);
    setDateTo(nextTo);
  }

  function updatePartnerFilter(nextPartnerId: number | undefined) {
    setPage(1);
    setPartnerId(nextPartnerId);
  }

  return {
    rows,
    total,
    totalAmountSum,
    page,
    pageSize: INVOICE_PAGE_SIZE,
    setPage,
    dateFrom,
    dateTo,
    setDateFilter: updateDateFilter,
    partnerId,
    setPartnerFilter: updatePartnerFilter,
    productKeyword: productKeywordInput,
    setProductKeyword: setProductKeywordInput,
    loading,
    error,
    refetch,
  };
}
