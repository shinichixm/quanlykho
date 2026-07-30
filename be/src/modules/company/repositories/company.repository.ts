import { prisma } from "../../../shared/db/prisma";
import type { CompanyInfoInput } from "../types/company.types";

export function findCompanyInfo() {
  return prisma.companyInfo.findFirst({ orderBy: { id: "asc" } });
}

export async function upsertCompanyInfo(input: CompanyInfoInput) {
  const existing = await prisma.companyInfo.findFirst({ orderBy: { id: "asc" } });

  if (!existing) {
    return prisma.companyInfo.create({ data: input });
  }

  return prisma.companyInfo.update({ where: { id: existing.id }, data: input });
}
