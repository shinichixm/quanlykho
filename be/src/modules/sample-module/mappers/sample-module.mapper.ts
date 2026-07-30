import type { SampleModuleRow } from "../types/sample-module.types";

type RawRow = {
  id: number;
  name: string;
  status: string;
  createdAt?: string;
};

export function mapSampleModuleRow(row: RawRow): SampleModuleRow {
  return {
    id: Number(row.id),
    name: String(row.name || ""),
    status: row.status === "inactive" ? "inactive" : "active",
    createdAt: row.createdAt ? String(row.createdAt) : undefined,
  };
}

export function mapSampleModuleList(rows: RawRow[]): SampleModuleRow[] {
  return rows.map(mapSampleModuleRow);
}
