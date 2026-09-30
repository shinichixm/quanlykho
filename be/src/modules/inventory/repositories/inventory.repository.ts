import { Prisma } from "@prisma/client";
import { prisma } from "../../../shared/db/prisma";

export async function findInventoryReportData(params: {
  keyword?: string;
  periodTo?: Date;
}) {
  // Hiển thị tất cả sản phẩm (kể cả sản phẩm mới thêm thủ công chưa có giao dịch,
  // hoặc lỡ bị bán trước khi có hóa đơn mua vào) — không chỉ những sản phẩm đã nhập kho.
  const where: Prisma.ProductWhereInput = {
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
