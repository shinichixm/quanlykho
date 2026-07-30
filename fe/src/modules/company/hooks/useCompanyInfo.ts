"use client";

import { useCallback, useEffect, useState } from "react";
import { getCompanyInfoApi, saveCompanyInfoApi } from "../services/company.api";
import type { CompanyInfoInput } from "../types/company.types";

const EMPTY_FORM: CompanyInfoInput = {
  name: "",
  taxCode: "",
  address: "",
  phone: "",
  email: "",
};

export function useCompanyInfo() {
  const [form, setForm] = useState<CompanyInfoInput>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCompanyInfoApi();
      if (data) {
        setForm({
          name: data.name,
          taxCode: data.taxCode ?? "",
          address: data.address ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateField(field: keyof CompanyInfoInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function save() {
    setSaving(true);
    setSaveError("");
    setSavedAt(null);
    try {
      const result = await saveCompanyInfoApi(form);
      setSavedAt(result.updatedAt);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Lưu thông tin công ty thất bại");
    } finally {
      setSaving(false);
    }
  }

  return {
    form,
    updateField,
    loading,
    error,
    saving,
    saveError,
    savedAt,
    save,
  };
}
