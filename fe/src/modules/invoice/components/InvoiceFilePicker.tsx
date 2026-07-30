"use client";

import { useRef } from "react";
import { Button } from "@/shared/ui/Button";
import { UploadIcon } from "@/shared/ui/icons";

export function InvoiceFilePicker({
  onSelect,
  loading,
}: {
  onSelect: (files: File[]) => void;
  loading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xml"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          e.target.value = "";
          onSelect(files);
        }}
      />
      <Button disabled={loading} onClick={() => inputRef.current?.click()}>
        <UploadIcon width={16} height={16} />
        {loading ? "Đang xem trước..." : "Nạp hóa đơn XML"}
      </Button>
    </>
  );
}
