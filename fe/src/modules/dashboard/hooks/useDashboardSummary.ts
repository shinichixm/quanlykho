"use client";

import { useEffect, useState } from "react";
import { getDashboardSummaryApi } from "../services/dashboard.api";
import type { DashboardSummary } from "../types/dashboard.types";

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardSummaryApi()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Có lỗi xảy ra"))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
