"use client";

import { useState } from "react";
import { confirmProductImportApi, previewProductImportApi } from "../services/inventory.api";
import type { ProductImportPreviewRow, ProductImportResultRow } from "../services/inventory.api";

export function useProductImport(onImported: () => void) {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<ProductImportPreviewRow[] | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [confirmResults, setConfirmResults] = useState<ProductImportResultRow[] | null>(null);

  async function selectFile(selected: File) {
    setFile(selected);
    setPreviewRows(null);
    setConfirmResults(null);
    setConfirmError("");
    setLoadingPreview(true);
    setPreviewError("");
    try {
      const rows = await previewProductImportApi(selected);
      setPreviewRows(rows);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Xem trước thất bại");
    } finally {
      setLoadingPreview(false);
    }
  }

  function cancel() {
    setFile(null);
    setPreviewRows(null);
    setPreviewError("");
    setConfirmError("");
    setConfirmResults(null);
  }

  async function confirm() {
    if (!file) return;

    setConfirming(true);
    setConfirmError("");
    try {
      const results = await confirmProductImportApi(file);
      setConfirmResults(results);

      const succeeded = results.filter((r) => r.success);
      if (succeeded.length > 0) onImported();
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : "Nhập sản phẩm thất bại");
    } finally {
      setConfirming(false);
    }
  }

  return {
    previewRows,
    loadingPreview,
    previewError,
    confirming,
    confirmError,
    confirmResults,
    selectFile,
    cancel,
    confirm,
  };
}
