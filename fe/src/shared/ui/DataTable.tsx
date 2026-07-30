import type { ReactNode } from "react";

type Column<T> = {
  key: keyof T | string;
  title: string;
  render?: (row: T, index: number) => ReactNode;
};

type Props<T> = {
  rows: T[];
  columns: Column<T>[];
};

export function DataTable<T>({ rows, columns }: Props<T>) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={String(col.key)}
              style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}
            >
              {col.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((col) => (
              <td key={String(col.key)} style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                {col.render
                  ? col.render(row, rowIndex)
                  : String((row as Record<string, unknown>)[String(col.key)] ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
