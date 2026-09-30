"use client";

import { useState } from "react";
import { confirmInvoicesApi, previewInvoicesApi } from "../services/invoice.api";
import type { InvoiceType, PreviewInvoiceRow } from "../types/invoice.types";

export function useInvoiceImport(type: InvoiceType, onImported: () => void) {
  const [files, setFiles] = useState<File[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewInvoiceRow[] | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  async function selectFiles(selected: File[]) {
    if (selected.length === 0) return;

    setFiles(selected);
    setPreviewRows(null);
    setConfirmError("");
    setLoadingPreview(true);
    setPreviewError("");
    try {
      const rows = await previewInvoicesApi(selected, type);
      setPreviewRows(rows);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Xem trước thất bại");
    } finally {
      setLoadingPreview(false);
    }
  }

  function removeFile(fileName: string) {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
    setPreviewRows((prev) => (prev ? prev.filter((r) => r.fileName !== fileName) : prev));
  }

  function cancel() {
    setFiles([]);
    setPreviewRows(null);
    setPreviewError("");
    setConfirmError("");
  }

  async function confirm() {
    setConfirming(true);
    setConfirmError("");
    try {
      const results = await confirmInvoicesApi(files, type);
      const failed = results.filter((r) => !r.success);
      const succeeded = results.filter((r) => r.success);

      if (succeeded.length > 0) {
        onImported();
      }

      if (failed.length > 0) {
        setConfirmError(
          `${succeeded.length}/${results.length} hóa đơn đã lưu. Lỗi: ` +
            failed.map((f) => `${f.fileName} (${f.error})`).join("; ")
        );
      } else {
        cancel();
      }
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : "Xác nhận thất bại");
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
    selectFiles,
    removeFile,
    cancel,
    confirm,
  };
}
