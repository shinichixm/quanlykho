import { companyInfoInputSchema } from "../schemas/company.schema";
import { findCompanyInfo, upsertCompanyInfo } from "../repositories/company.repository";
import type { CompanyInfoInput, CompanyInfoResult } from "../types/company.types";

export async function getCompanyInfoService(): Promise<CompanyInfoResult> {
  return findCompanyInfo();
}

export async function saveCompanyInfoService(input: CompanyInfoInput) {
  const parsed = companyInfoInputSchema.parse(input);

  return upsertCompanyInfo({
    name: parsed.name,
    taxCode: parsed.taxCode || null,
    address: parsed.address || null,
    phone: parsed.phone || null,
    email: parsed.email || null,
  });
}
