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
          product: true,
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
          product: true,
          substitutions: {
            include: { substituteProduct: true },
          },
        },
      },
    },
  });
}

// Lấy toàn bộ lịch sử biến động tồn kho (nhập, điều chỉnh, dùng làm hàng thay thế,
// bán ra) của 1 danh sách sản phẩm — dùng để mô phỏng tồn kho tại từng thời điểm
// bán thay vì chỉ nhìn tồn kho hiện tại (xem lib/historical-stock.ts).
export async function findProductMovementsForReconciliation(productIds: number[]) {
  if (productIds.length === 0) {
    return { purchaseItems: [], saleItems: [], adjustments: [], substitutionsUsed: [] };
  }

  const [purchaseItems, saleItems, adjustments, substitutionsUsed] = await Promise.all([
    prisma.invoiceItem.findMany({
      where: { productId: { in: productIds }, invoice: { type: "purchase" } },
      select: {
        productId: true,
        quantity: true,
        invoiceId: true,
        invoice: { select: { issuedAt: true } },
      },
    }),
    prisma.invoiceItem.findMany({
      where: { productId: { in: productIds }, invoice: { type: "sale" } },
      select: {
        id: true,
        productId: true,
        quantity: true,
        invoiceId: true,
        invoice: { select: { issuedAt: true } },
      },
    }),
    prisma.inventoryAdjustment.findMany({
      where: { productId: { in: productIds } },
      select: { id: true, productId: true, quantity: true, adjustedAt: true },
    }),
    prisma.reconciliationSubstitution.findMany({
      where: { substituteProductId: { in: productIds }, status: "completed" },
      select: { id: true, substituteProductId: true, quantity: true, createdAt: true },
    }),
  ]);

  return {
    purchaseItems: purchaseItems.map((p) => ({
      productId: p.productId,
      quantity: p.quantity,
      invoiceId: p.invoiceId,
      issuedAt: p.invoice.issuedAt,
    })),
    saleItems: saleItems.map((s) => ({
      invoiceItemId: s.id,
      productId: s.productId,
      quantity: s.quantity,
      invoiceId: s.invoiceId,
      issuedAt: s.invoice.issuedAt,
    })),
    adjustments,
    substitutionsUsed,
  };
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
      items: { include: { product: true } },
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

// Xóa 1 phiếu bổ sung thay thế. Nếu phiếu đã "completed" (đã trừ kho sản phẩm
// thay thế), hoàn lại đúng số lượng đó vào Inventory + ghi 1 StockTransaction
// "in" để có vết — rồi mở lại hóa đơn (bỏ reconciliationResolvedAt) vì hóa đơn
// không còn chắc đã được bổ sung đủ nữa.
export async function deleteSubstitutionEntry(params: {
  invoiceId: number;
  substitutionId: number;
}) {
  return prisma.$transaction(async (tx) => {
    const substitution = await tx.reconciliationSubstitution.findUnique({
      where: { id: params.substitutionId },
    });

    if (!substitution || substitution.invoiceId !== params.invoiceId) {
      throw new Error("Không tìm thấy bổ sung thay thế cần xóa");
    }

    if (substitution.status === "completed") {
      const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: params.invoiceId } });

      await tx.inventory.upsert({
        where: { productId: substitution.substituteProductId },
        create: { productId: substitution.substituteProductId, quantity: substitution.quantity },
        update: { quantity: { increment: substitution.quantity } },
      });

      await tx.stockTransaction.create({
        data: {
          productId: substitution.substituteProductId,
          type: "in",
          quantity: substitution.quantity,
          invoiceId: params.invoiceId,
          note: `Hoàn trả do xóa bổ sung thay thế cho hóa đơn ${invoice.invoiceNo}`,
        },
      });
    }

    await tx.reconciliationSubstitution.delete({ where: { id: params.substitutionId } });

    await tx.invoice.update({
      where: { id: params.invoiceId },
      data: { reconciliationResolvedAt: null },
    });
  });
}
