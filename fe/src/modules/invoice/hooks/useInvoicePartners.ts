"use client";

import { useEffect, useState } from "react";
import { listInvoicePartnersApi } from "../services/invoice.api";
import type { InvoicePartnerOption, InvoiceType } from "../types/invoice.types";

export function useInvoicePartners(type: InvoiceType) {
  const [partners, setPartners] = useState<InvoicePartnerOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    listInvoicePartnersApi(type)
      .then((data) => {
        if (!cancelled) setPartners(data);
      })
      .catch(() => {
        if (!cancelled) setPartners([]);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  return partners;
}
