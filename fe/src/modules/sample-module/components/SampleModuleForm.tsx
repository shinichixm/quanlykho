"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";

type Props = {
  onSearch: (keyword: string) => void;
};

export function SampleModuleForm({ onSearch }: Props) {
  const [keyword, setKeyword] = useState("");

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Nhập từ khóa..."
        style={{ flex: 1, padding: 8, border: "1px solid #ccc", borderRadius: 8 }}
      />
      <Button onClick={() => onSearch(keyword)}>Tìm</Button>
    </div>
  );
}
