import { Prisma } from "@prisma/client";
import { prisma } from "../../../shared/db/prisma";

export function findSaleInvoicesForReconciliation(partnerId?: number) {
  return prisma.invoice.findMany({
    where: { type: "sale", ...(partnerId ? { partnerId } : {}) },
    orderBy: { issuedAt: "desc" },
    include: {
      partner: true,
      items: {
        include: {
          product: {
            include: { inventory: true },
          },
          substitutions: {
            include: { substituteProduct: true },
          },
        },
      },
    },
  });
}

export function findSaleInvoiceForReconciliationById(invoiceId: number) {
  return prisma.invoice.findFirst({
    where: { id: invoiceId, type: "sale" },
    include: {
      partner: true,
      items: {
        include: {
          product: {
            include: { inventory: true },
          },
          substitutions: {
            include: { substituteProduct: true },
          },
        },
      },
    },
  });
}

export function findInStockProducts(keyword?: string) {
  const where: Prisma.ProductWhereInput = {
    stockTxns: { some: { type: "in" } },
    inventory: { quantity: { gt: 0 } },
    ...(keyword
      ? {
          OR: [
            { code: { contains: keyword } },
            { name: { contains: keyword } },
          ],
        }
      : {}),
  };

  return prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
    include: { inventory: true },
  });
}

export function findInvoiceWithItemsForReconciliation(invoiceId: number) {
  return prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: { include: { product: { include: { inventory: true } } } },
    },
  });
}

export async function replaceInvoiceSubstitutions(params: {
  invoiceId: number;
  entries: { invoiceItemId: number; substituteProductId: number; quantity: number }[];
  complete: boolean;
  invoiceNo: string;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.reconciliationSubstitution.deleteMany({ where: { invoiceId: params.invoiceId } });

    if (params.entries.length > 0) {
      await tx.reconciliationSubstitution.createMany({
        data: params.entries.map((entry) => ({
          invoiceId: params.invoiceId,
          invoiceItemId: entry.invoiceItemId,
          substituteProductId: entry.substituteProductId,
          quantity: entry.quantity,
          status: params.complete ? "completed" : "draft",
        })),
      });
    }

    if (!params.complete) {
      return tx.invoice.findUniqueOrThrow({ where: { id: params.invoiceId } });
    }

    const totalsByProduct = new Map<number, number>();
    for (const entry of params.entries) {
      totalsByProduct.set(
        entry.substituteProductId,
        (totalsByProduct.get(entry.substituteProductId) ?? 0) + entry.quantity
      );
    }

    for (const [substituteProductId, quantity] of totalsByProduct) {
      const inventory = await tx.inventory.findUnique({ where: { productId: substituteProductId } });
      const currentQty = inventory ? Number(inventory.quantity) : 0;
      if (currentQty < quantity) {
        const product = await tx.product.findUnique({ where: { id: substituteProductId } });
        throw new Error(
          `Sản phẩm thay thế "${product?.name || substituteProductId}" không đủ tồn kho (còn ${currentQty}, cần ${quantity})`
        );
      }

      await tx.inventory.update({
        where: { productId: substituteProductId },
        data: { quantity: { decrement: quantity } },
      });

      await tx.stockTransaction.create({
        data: {
          productId: substituteProductId,
          type: "out",
          quantity,
          invoiceId: params.invoiceId,
          note: `Bổ sung thay thế cho hóa đơn ${params.invoiceNo} (tra soát âm kho)`,
        },
      });
    }

    return tx.invoice.update({
      where: { id: params.invoiceId },
      data: { reconciliationResolvedAt: new Date() },
    });
  });
}
