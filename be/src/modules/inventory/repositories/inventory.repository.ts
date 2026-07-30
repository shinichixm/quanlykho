import { Prisma } from "@prisma/client";
import { prisma } from "../../../shared/db/prisma";

export async function findInventoryReportData(params: {
  keyword?: string;
  periodTo?: Date;
}) {
  // Danh sách tồn kho chỉ gồm những sản phẩm đã từng nhập kho (có hóa đơn mua vào).
  const where: Prisma.ProductWhereInput = {
    stockTxns: { some: { type: "in" } },
    ...(params.keyword
      ? {
          OR: [
            { code: { contains: params.keyword } },
            { name: { contains: params.keyword } },
          ],
        }
      : {}),
  };

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
  });

  const productIds = products.map((product) => product.id);
  if (productIds.length === 0) {
    return { products, purchaseItems: [], saleItems: [] };
  }

  const issuedAtFilter = params.periodTo ? { issuedAt: { lte: params.periodTo } } : {};

  const [purchaseItems, saleItems] = await Promise.all([
    prisma.invoiceItem.findMany({
      where: {
        productId: { in: productIds },
        invoice: { type: "purchase", ...issuedAtFilter },
      },
      select: {
        productId: true,
        quantity: true,
        amount: true,
        invoice: { select: { issuedAt: true } },
      },
    }),
    prisma.invoiceItem.findMany({
      where: {
        productId: { in: productIds },
        invoice: { type: "sale", ...issuedAtFilter },
      },
      select: {
        productId: true,
        quantity: true,
        amount: true,
        invoice: { select: { issuedAt: true } },
      },
    }),
  ]);

  return { products, purchaseItems, saleItems };
}
