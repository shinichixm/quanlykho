import { prisma } from "../../../shared/db/prisma";

export function countProducts() {
  return prisma.product.count();
}

export function countInvoicesByTypeInRange(type: "purchase" | "sale", from: Date, to: Date) {
  return prisma.invoice.count({
    where: { type, issuedAt: { gte: from, lte: to } },
  });
}

export function findRecentInvoices(limit: number) {
  return prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { partner: true },
  });
}
