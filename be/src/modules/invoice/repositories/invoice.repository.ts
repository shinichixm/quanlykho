import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import { prisma } from "../../../shared/db/prisma";
import { normalizeKey } from "../../../shared/lib/normalize-key";
import type {
  ImportInvoiceResult,
  InvoiceCategory,
  InvoiceType,
  ParsedInvoice,
} from "../types/invoice.types";

function generateProductCode() {
  return `AUTO-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function importInvoiceTransaction(
  parsed: ParsedInvoice,
  type: InvoiceType,
  category: InvoiceCategory = "goods"
): Promise<ImportInvoiceResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      let partner = await tx.partner.findUnique({
        where: { taxCode: parsed.partnerTaxCode },
      });

      if (!partner) {
        partner = await tx.partner.create({
          data: {
            taxCode: parsed.partnerTaxCode,
            name: parsed.partnerName,
            address: parsed.partnerAddress,
          },
        });
      }

      const invoice = await tx.invoice.create({
        data: {
          type,
          category,
          invoiceNo: parsed.invoiceNo,
          invoiceSeries: parsed.invoiceSeries,
          issuedAt: parsed.issuedAt,
          partnerId: partner.id,
          totalAmount: parsed.totalAmount,
          status: "processed",
        },
      });

      // Hóa đơn được phân loại "chi phí" khi nạp: lưu dòng hàng vào CostItem,
      // KHÔNG tạo/so khớp Product, không đụng StockTransaction/Inventory —
      // tránh lặp lại việc chi phí (thi công, dịch vụ...) bị lẫn vào hàng tồn kho.
      if (category === "cost") {
        for (const item of parsed.items) {
          await tx.costItem.create({
            data: {
              invoiceId: invoice.id,
              name: item.name,
              unit: item.unit,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
            },
          });
        }

        return {
          invoiceId: invoice.id,
          invoiceNo: invoice.invoiceNo,
          itemCount: parsed.items.length,
          createdProductCount: 0,
        };
      }

      let createdProductCount = 0;

      for (const item of parsed.items) {
        const nameKey = normalizeKey(item.name);
        const unitKey = normalizeKey(item.unit);

        // So khớp CHỈ theo tên hàng đã chuẩn hóa (không xét đơn vị tính — cùng
        // một mặt hàng nhưng đơn vị ghi khác nhau giữa các hóa đơn vẫn coi là
        // 1 sản phẩm). Tên hàng ở hóa đơn mua vào và bán ra thường lệch nhau vài
        // khoảng trắng / xuống dòng / hoa-thường, so bằng chuỗi gốc sẽ tạo sản
        // phẩm trùng và làm sai tồn kho.
        let product = await tx.product.findFirst({
          where: { nameKey },
          orderBy: { id: "asc" },
        });

        if (!product) {
          product = await tx.product.create({
            data: {
              code: generateProductCode(),
              name: item.name,
              nameKey,
              unit: item.unit,
              unitKey,
            },
          });
          createdProductCount += 1;
        }

        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            productId: product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
          },
        });

        const stockType = type === "purchase" ? "in" : "out";

        await tx.stockTransaction.create({
          data: {
            productId: product.id,
            type: stockType,
            quantity: item.quantity,
            invoiceId: invoice.id,
            note: `Từ hóa đơn ${parsed.invoiceSeries ?? ""}${parsed.invoiceNo}`.trim(),
          },
        });

        const delta = type === "purchase" ? item.quantity : -item.quantity;

        await tx.inventory.upsert({
          where: { productId: product.id },
          create: { productId: product.id, quantity: delta },
          update: { quantity: { increment: delta } },
        });
      }

      return {
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo,
        itemCount: parsed.items.length,
        createdProductCount,
      };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Hóa đơn này đã được nạp vào hệ thống trước đó");
    }
    throw error;
  }
}

export async function findInvoiceList(params: {
  type: InvoiceType;
  category?: InvoiceCategory;
  skip: number;
  take: number;
  dateFrom?: Date;
  dateTo?: Date;
  partnerId?: number;
  productKeyword?: string;
}) {
  const where: Prisma.InvoiceWhereInput = {
    type: params.type,
    ...(params.category ? { category: params.category } : {}),
    ...(params.partnerId ? { partnerId: params.partnerId } : {}),
    ...(params.dateFrom || params.dateTo
      ? {
          issuedAt: {
            ...(params.dateFrom ? { gte: params.dateFrom } : {}),
            ...(params.dateTo ? { lte: params.dateTo } : {}),
          },
        }
      : {}),
    ...(params.productKeyword
      ? {
          items: {
            some: {
              product: {
                OR: [
                  { name: { contains: params.productKeyword } },
                  { code: { contains: params.productKeyword } },
                ],
              },
            },
          },
        }
      : {}),
  };

  const [rows, total, aggregate] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { issuedAt: "desc" },
      include: { partner: true, items: true },
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.aggregate({ where, _sum: { totalAmount: true } }),
  ]);

  return { rows, total, totalAmountSum: aggregate._sum.totalAmount ?? new Prisma.Decimal(0) };
}

export function findPartnersByInvoiceType(type: InvoiceType) {
  return prisma.partner.findMany({
    where: { invoices: { some: { type } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export function findInvoiceDetailById(id: number) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      partner: true,
      items: { include: { product: true } },
      costItems: true,
    },
  });
}

async function deleteInvoicesByIdsInTx(
  tx: Prisma.TransactionClient,
  ids: number[]
) {
  const invoices = await tx.invoice.findMany({
    where: { id: { in: ids } },
    include: { items: true },
  });

  if (invoices.length === 0) {
    throw new Error("Không tìm thấy hóa đơn cần xóa");
  }

  for (const invoice of invoices) {
    for (const item of invoice.items) {
      const delta = invoice.type === "purchase" ? -item.quantity.toNumber() : item.quantity.toNumber();

      await tx.inventory.upsert({
        where: { productId: item.productId },
        create: { productId: item.productId, quantity: delta },
        update: { quantity: { increment: delta } },
      });
    }

    await tx.stockTransaction.deleteMany({ where: { invoiceId: invoice.id } });
    await tx.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
    await tx.costItem.deleteMany({ where: { invoiceId: invoice.id } });
  }

  await tx.invoice.deleteMany({ where: { id: { in: invoices.map((i) => i.id) } } });

  return invoices.length;
}

export async function deleteInvoiceById(id: number) {
  return prisma.$transaction((tx) => deleteInvoicesByIdsInTx(tx, [id]));
}

export async function deleteInvoicesByIds(ids: number[]) {
  return prisma.$transaction((tx) => deleteInvoicesByIdsInTx(tx, ids));
}
