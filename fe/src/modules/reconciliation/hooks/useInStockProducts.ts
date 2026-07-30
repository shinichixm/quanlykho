"use client";

import { useEffect, useState } from "react";
import { listInStockProductsApi } from "../services/reconciliation.api";
import type { InStockProduct } from "../types/reconciliation.types";

export function useInStockProducts() {
  const [products, setProducts] = useState<InStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listInStockProductsApi()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading };
}
