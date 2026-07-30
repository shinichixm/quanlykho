"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { useCompanyInfo } from "@/modules/company/hooks/useCompanyInfo";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("vi-VN");
}

export default function CompanySettingsPage() {
  const { form, updateField, loading, error, saving, saveError, savedAt, save } =
    useCompanyInfo();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save();
  }

  return (
    <div>
      <PageHeader
        title="Thông tin công ty"
        description="Thông tin này sẽ được dùng làm tiêu đề khi xuất báo cáo"
      />

      <Card className="max-w-2xl">
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">Đang tải...</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}
            {saveError && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {saveError}
              </div>
            )}
            {savedAt && (
              <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                Đã lưu lúc {formatDateTime(savedAt)}
              </div>
            )}

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Tên công ty <span className="text-red-500">*</span>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Công ty TNHH ..."
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Mã số thuế
              <input
                type="text"
                value={form.taxCode}
                onChange={(e) => updateField("taxCode", e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Địa chỉ
              <input
                type="text"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
              />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Số điện thoại
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                />
              </label>
            </div>

            <div>
              <Button type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thông tin"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
