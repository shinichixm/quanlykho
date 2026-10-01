import { isPlaceholderTaxCode, parseInvoiceXml } from "../lib/xml-invoice-parser";
import {
  deleteInvoiceById,
  deleteInvoicesByIds,
  findInvoiceDetailById,
  findInvoiceList,
  findPartnersByInvoiceType,
  importInvoiceTransaction,
} from "../repositories/invoice.repository";
import { invoiceListQuerySchema } from "../schemas/invoice.schema";
import { INVOICE_DEFAULT_PAGE_SIZE } from "../constants/invoice.constants";
import type {
  ConfirmInvoiceRow,
  InvoiceCategory,
  InvoiceDetail,
  InvoiceListItem,
  InvoiceType,
  PreviewInvoiceRow,
} from "../types/invoice.types";

type UploadedFile = { fileName: string; buffer: Buffer };

export async function previewInvoiceXmlBatchService(
  files: UploadedFile[],
  type: InvoiceType
): Promise<PreviewInvoiceRow[]> {
  return files.map((file) => {
    try {
      const parsed = parseInvoiceXml(file.buffer.toString("utf-8"), type);
      return {
        fileName: file.fileName,
        invoiceNo: parsed.invoiceNo,
        invoiceSeries: parsed.invoiceSeries,
        issuedAt: parsed.issuedAt.toISOString(),
        partnerTaxCode: parsed.partnerTaxCodeMissing ? null : parsed.partnerTaxCode,
        partnerName: parsed.partnerName,
        totalAmount: parsed.totalAmount,
        items: parsed.items,
        error: null,
      };
    } catch (error) {
      return {
        fileName: file.fileName,
        invoiceNo: null,
        invoiceSeries: null,
        issuedAt: null,
        partnerTaxCode: null,
        partnerName: null,
        totalAmount: null,
        items: [],
        error: error instanceof Error ? error.message : "Không đọc được file XML",
      };
    }
  });
}

export async function confirmInvoiceXmlBatchService(
  files: UploadedFile[],
  type: InvoiceType,
  categoriesByFileName: Record<string, InvoiceCategory> = {}
): Promise<ConfirmInvoiceRow[]> {
  const results: ConfirmInvoiceRow[] = [];

  for (const file of files) {
    try {
      const parsed = parseInvoiceXml(file.buffer.toString("utf-8"), type);
      const category = categoriesByFileName[file.fileName] ?? "goods";
      const imported = await importInvoiceTransaction(parsed, type, category);
      results.push({
        fileName: file.fileName,
        success: true,
        invoiceNo: imported.invoiceNo,
        itemCount: imported.itemCount,
        createdProductCount: imported.createdProductCount,
        error: null,
      });
    } catch (error) {
      results.push({
        fileName: file.fileName,
        success: false,
        invoiceNo: null,
        itemCount: 0,
        createdProductCount: 0,
        error: error instanceof Error ? error.message : "Nạp hóa đơn thất bại",
      });
    }
  }

  return results;
}

export async function listInvoiceService(input: {
  type: InvoiceType;
  category?: InvoiceCategory;
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
  partnerId?: number;
  productKeyword?: string;
}): Promise<{ rows: InvoiceListItem[]; total: number; totalAmountSum: string }> {
  const parsed = invoiceListQuerySchema.parse({
    type: input.type,
    category: input.category,
    page: input.page ?? 1,
    pageSize: input.pageSize ?? INVOICE_DEFAULT_PAGE_SIZE,
    dateFrom: input.dateFrom || undefined,
    dateTo: input.dateTo || undefined,
    partnerId: input.partnerId,
    productKeyword: input.productKeyword || undefined,
  });

  const skip = (parsed.page - 1) * parsed.pageSize;

  // dateTo là ngày (không có giờ) nên đẩy tới cuối ngày để bao trọn cả ngày đó
  const dateTo = parsed.dateTo
    ? new Date(
        Date.UTC(
          parsed.dateTo.getUTCFullYear(),
          parsed.dateTo.getUTCMonth(),
          parsed.dateTo.getUTCDate(),
          23,
          59,
          59,
          999
        )
      )
    : undefined;

  const { rows, total, totalAmountSum } = await findInvoiceList({
    type: parsed.type,
    category: parsed.category,
    skip,
    take: parsed.pageSize,
    dateFrom: parsed.dateFrom,
    dateTo,
    partnerId: parsed.partnerId,
    productKeyword: parsed.productKeyword,
  });

  return {
    rows: rows.map((row) => ({
      id: row.id,
      type: row.type as InvoiceType,
      category: row.category as InvoiceCategory,
      invoiceNo: row.invoiceNo,
      invoiceSeries: row.invoiceSeries,
      issuedAt: row.issuedAt,
      partnerName: row.partner.name,
      totalAmount: row.totalAmount.toString(),
      status: row.status,
      createdAt: row.createdAt,
    })),
    total,
    totalAmountSum: totalAmountSum.toString(),
  };
}

export async function getInvoiceDetailService(id: number): Promise<InvoiceDetail> {
  const invoice = await findInvoiceDetailById(id);
  if (!invoice) {
    throw new Error("Không tìm thấy hóa đơn");
  }

  // Hóa đơn "chi phí" không có Product -> dòng hàng nằm ở costItems thay vì items.
  const items =
    invoice.category === "cost"
      ? invoice.costItems.map((item) => ({
          id: item.id,
          productName: item.name,
          productCode: "",
          unit: item.unit,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          amount: item.amount.toString(),
        }))
      : invoice.items.map((item) => ({
          id: item.id,
          productName: item.product.name,
          productCode: item.product.code,
          unit: item.product.unit,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          amount: item.amount.toString(),
        }));

  return {
    id: invoice.id,
    type: invoice.type as InvoiceType,
    category: invoice.category as InvoiceCategory,
    invoiceNo: invoice.invoiceNo,
    invoiceSeries: invoice.invoiceSeries,
    issuedAt: invoice.issuedAt,
    status: invoice.status,
    totalAmount: invoice.totalAmount.toString(),
    partner: {
      name: invoice.partner.name,
      taxCode: isPlaceholderTaxCode(invoice.partner.taxCode)
        ? "Không MST"
        : invoice.partner.taxCode,
      address: invoice.partner.address,
    },
    items,
  };
}

export async function listInvoicePartnersService(
  type: InvoiceType
): Promise<{ id: number; name: string }[]> {
  return findPartnersByInvoiceType(type);
}

export async function deleteInvoiceService(id: number): Promise<void> {
  await deleteInvoiceById(id);
}

export async function deleteInvoicesBulkService(ids: number[]): Promise<{ deletedCount: number }> {
  const deletedCount = await deleteInvoicesByIds(ids);
  return { deletedCount };
}
