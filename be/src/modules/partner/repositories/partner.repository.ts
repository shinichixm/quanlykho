import { prisma } from "../../../shared/db/prisma";
import type { PartnerInput } from "../types/partner.types";

export function findPartnerByTaxCode(taxCode: string) {
  return prisma.partner.findUnique({ where: { taxCode } });
}

export function createPartner(input: PartnerInput) {
  return prisma.partner.create({ data: input });
}
