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
    return { products, purchaseItems: [], saleItems: [], adjustments: [], substitutionsUsed: [] };
  }

  const issuedAtFilter = params.periodTo ? { issuedAt: { lte: params.periodTo } } : {};
  const adjustedAtFilter = params.periodTo ? { adjustedAt: { lte: params.periodTo } } : {};
  const createdAtFilter = params.periodTo ? { createdAt: { lte: params.periodTo } } : {};

  const [purchaseItems, saleItems, adjustments, substitutionsUsed] = await Promise.all([
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
    prisma.inventoryAdjustment.findMany({
      where: { productId: { in: productIds }, ...adjustedAtFilter },
      select: { productId: true, quantity: true, unitPrice: true, adjustedAt: true },
    }),
    // Sản phẩm dùng làm hàng thay thế khi "bổ sung" hóa đơn âm kho (tra soát) bị trừ
    // thẳng vào Inventory.quantity mà KHÔNG tạo InvoiceItem — phải cộng riêng vào đây
    // để SL tồn trên báo cáo khớp với tồn kho thực tế dùng ở màn tra soát.
    prisma.reconciliationSubstitution.findMany({
      where: {
        substituteProductId: { in: productIds },
        status: "completed",
        ...createdAtFilter,
      },
      select: { substituteProductId: true, quantity: true, createdAt: true },
    }),
  ]);

  return { products, purchaseItems, saleItems, adjustments, substitutionsUsed };
}

// Dữ liệu thô để tính giá vốn bình quân hiện tại cho 1 danh sách sản phẩm cụ thể
// (dùng ở Giỏ hàng — không cần opening/in/out theo kỳ như báo cáo Tồn kho).
export async function findAvgCostInputsByProductIds(productIds: number[]) {
  if (productIds.length === 0) {
    return { purchaseItems: [], positiveAdjustments: [] };
  }

  const [purchaseItems, positiveAdjustments] = await Promise.all([
    prisma.invoiceItem.findMany({
      where: { productId: { in: productIds }, invoice: { type: "purchase" } },
      select: { productId: true, quantity: true, amount: true },
    }),
    prisma.inventoryAdjustment.findMany({
      where: { productId: { in: productIds }, quantity: { gt: 0 } },
      select: { productId: true, quantity: true, unitPrice: true },
    }),
  ]);

  return { purchaseItems, positiveAdjustments };
}

export function createInventoryAdjustment(input: {
  productId: number;
  quantity: Prisma.Decimal | number;
  unitPrice: Prisma.Decimal | number;
  note?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const adjustment = await tx.inventoryAdjustment.create({
      data: {
        productId: input.productId,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        note: input.note || null,
      },
    });

    // Đồng bộ luôn Inventory.quantity (tồn kho thời gian thực) — bảng này được
    // dùng riêng ở màn tra soát hóa đơn (chọn sản phẩm thay thế còn hàng), nếu
    // không cập nhật thì phiếu điều chỉnh chỉ đổi số trên báo cáo, không đổi
    // được số sản phẩm hiện ra khi tìm hàng thay thế.
    await tx.inventory.upsert({
      where: { productId: input.productId },
      create: { productId: input.productId, quantity: input.quantity },
      update: { quantity: { increment: input.quantity } },
    });

    // Màn tra soát chỉ coi 1 sản phẩm là "còn hàng" khi vừa có Inventory.quantity > 0
    // VỪA có ít nhất 1 StockTransaction type "in" — nếu thiếu dòng này, tồn dương
    // do điều chỉnh vẫn không hiện ra được khi tìm hàng thay thế.
    const qty = Number(input.quantity);
    if (qty !== 0) {
      await tx.stockTransaction.create({
        data: {
          productId: input.productId,
          type: qty > 0 ? "in" : "out",
          quantity: Math.abs(qty),
          invoiceId: null,
          note: input.note ? `Điều chỉnh tồn kho: ${input.note}` : "Điều chỉnh tồn kho",
        },
      });
    }

    return adjustment;
  });
}
