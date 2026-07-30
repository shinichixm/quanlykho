"use client";

import { useEffect, useState } from "react";
import type {
  SampleModuleInput,
  SampleModuleRow,
} from "../types/sample-module.types";
import { searchSampleModule } from "../services/sample-module.api";

type UseSampleModuleResult = {
  rows: SampleModuleRow[];
  total: number;
  loading: boolean;
  error: string;
};

export function useSampleModule(input: SampleModuleInput): UseSampleModuleResult {
  const [rows, setRows] = useState<SampleModuleRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        setLoading(true);
        setError("");
        const res = await searchSampleModule(input);

        if (!active) return;
        setRows(res.data.rows);
        setTotal(res.data.total);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (active) setLoading(false);
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [JSON.stringify(input)]);

  return { rows, total, loading, error };
}
