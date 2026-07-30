"use client";

import { DataTable } from "@/shared/ui/DataTable";
import type { SampleModuleRow } from "../types/sample-module.types";

type Props = {
  rows: SampleModuleRow[];
};

export function SampleModuleTable({ rows }: Props) {
  return (
    <DataTable
      rows={rows}
      columns={[
        { key: "id", title: "ID" },
        { key: "name", title: "Tên" },
        { key: "status", title: "Trạng thái" },
        { key: "createdAt", title: "Ngày tạo" },
      ]}
    />
  );
}
