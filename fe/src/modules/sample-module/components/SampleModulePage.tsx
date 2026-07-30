"use client";

import { useState } from "react";
import { SampleModuleForm } from "./SampleModuleForm";
import { SampleModuleTable } from "./SampleModuleTable";
import { useSampleModule } from "../hooks/useSampleModule";
import { SAMPLE_MODULE_PAGE_SIZE } from "../constants/sample-module.constants";

export function SampleModulePage() {
  const [keyword, setKeyword] = useState("");
  const { rows, total, loading, error } = useSampleModule({
    keyword,
    page: 1,
    pageSize: SAMPLE_MODULE_PAGE_SIZE,
  });

  return (
    <div style={{ padding: 16 }}>
      <h2>Sample Module FE</h2>
      <SampleModuleForm onSearch={setKeyword} />
      {loading && <p>Đang tải...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <p>Tổng: {total}</p>
      <SampleModuleTable rows={rows} />
    </div>
  );
}
