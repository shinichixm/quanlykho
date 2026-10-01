import { getCompanyInfoService } from "../../company/services/company.service";
import { buildReconciliationDetailExcel } from "../lib/reconciliation-detail-excel";
import {
  findInStockProducts,
  findInvoiceWithItemsForReconciliation,
  findSaleInvoiceForReconciliationById,
  findSaleInvoicesForReconciliation,
  replaceInvoiceSubstitutions,
} from "../repositories/reconciliation.repository";
import {
  reconciliationListQuerySchema,
  saveSubstitutionsBodySchema,
} from "../schemas/reconciliation.schema";
import type {
  InStockProduct,
  ReconciliationInvoiceRow,
  ReconciliationItem,
  ReconciliationListResult,
  ReconciliationStatus,
  SubstitutionEntry,
} from "../types/reconciliation.types";

type Decimalish = { toString(): string };

function buildReconciliationRow(invoice: {
  id: number;
  invoiceNo: string;
  invoiceSeries: string | null;
  issuedAt: Date;
  totalAmount: Decimalish;
  reconciliationResolvedAt: Date | null;
  partner: { name: string };
  items: {
    id: number;
    quantity: Decimalish;
    product: { code: string; name: string; unit: string; inventory: { quantity: Decimalish } | null };
    substitutions: {
      id: number;
      quantity: Decimalish;
      status: string;
      substituteProduct: { id: number; code: string; name: string };
    }[];
  }[];
}): ReconciliationInvoiceRow {
  const items: ReconciliationItem[] = invoice.items.map((item) => {
    const inventory = item.product.inventory;
    const currentStock = inventory ? Number(inventory.quantity) : 0;
    const ok = Boolean(inventory) && currentStock >= 0;

    const substitutions: SubstitutionEntry[] = item.substitutions.map((sub) => ({
      id: sub.id,
      substituteProductId: sub.substituteProduct.id,
      substituteProductCode: sub.substituteProduct.code,
      substituteProductName: sub.substituteProduct.name,
      quantity: sub.quantity.toString(),
      status: sub.status as "draft" | "completed",
    }));

    return {
      invoiceItemId: item.id,
      productCode: item.product.code,
      productName: item.product.name,
      unit: item.product.unit,
      quantitySold: item.quantity.toString(),
      currentStock: currentStock.toString(),
      ok,
      substitutions,
    };
  });

  const status: ReconciliationStatus = invoice.reconciliationResolvedAt
    ? "completed"
    : items.every((item) => item.ok)
      ? "completed"
      : "negative_stock";

  return {
    id: invoice.id,
    invoiceNo: invoice.invoiceNo,
    invoiceSeries: invoice.invoiceSeries,
    issuedAt: invoice.issuedAt,
    partnerName: invoice.partner.name,
    totalAmount: invoice.totalAmount.toString(),
    status,
    items,
  };
}

export async function listReconciliationInvoicesService(input: {
  status?: ReconciliationStatus;
  partnerId?: number;
  page?: number;
  pageSize?: number;
}): Promise<ReconciliationListResult> {
  const parsed = reconciliationListQuerySchema.parse({
    status: input.status,
    partnerId: input.partnerId,
    page: input.page ?? 1,
    pageSize: input.pageSize ?? 20,
  });

  const invoices = await findSaleInvoicesForReconciliation(parsed.partnerId);
  const rows = invoices.map(buildReconciliationRow);

  const filteredRows = parsed.status ? rows.filter((row) => row.status === parsed.status) : rows;

  const start = (parsed.page - 1) * parsed.pageSize;

  return {
    rows: filteredRows.slice(start, start + parsed.pageSize),
    total: filteredRows.length,
  };
}

export async function listInStockProductsForReconciliationService(
  keyword?: string
): Promise<InStockProduct[]> {
  const products = await findInStockProducts(keyword);

  return products.map((product) => ({
    id: product.id,
    code: product.code,
    name: product.name,
    unit: product.unit,
    stockQty: (product.inventory?.quantity ?? 0).toString(),
  }));
}

export async function saveInvoiceSubstitutionsService(
  invoiceId: number,
  input: { action: "draft" | "complete"; entries: unknown }
): Promise<ReconciliationInvoiceRow> {
  const parsed = saveSubstitutionsBodySchema.parse(input);

  const invoice = await findInvoiceWithItemsForReconciliation(invoiceId);
  if (!invoice || invoice.type !== "sale") {
    throw new Error("Không tìm thấy hóa đơn bán ra");
  }

  if (invoice.reconciliationResolvedAt) {
    throw new Error("Hóa đơn đã hoàn thành tra soát, không thể chỉnh sửa lại");
  }

  const itemIds = new Set(invoice.items.map((item) => item.id));
  for (const entry of parsed.entries) {
    if (!itemIds.has(entry.invoiceItemId)) {
      throw new Error("Dòng hàng không thuộc hóa đơn này");
    }
  }

  if (parsed.action === "complete") {
    const negativeItems = invoice.items.filter((item) => {
      const inventory = item.product.inventory;
      const currentStock = inventory ? Number(inventory.quantity) : 0;
      return !inventory || currentStock < 0;
    });

    for (const item of negativeItems) {
      const totalSubstituted = parsed.entries
        .filter((entry) => entry.invoiceItemId === item.id)
        .reduce((sum, entry) => sum + entry.quantity, 0);

      if (totalSubstituted < Number(item.quantity)) {
        throw new Error(
          `Sản phẩm "${item.product.name}" chưa được bổ sung đủ số lượng thay thế (cần ${item.quantity}, đã bổ sung ${totalSubstituted})`
        );
      }
    }
  }

  await replaceInvoiceSubstitutions({
    invoiceId,
    entries: parsed.entries,
    complete: parsed.action === "complete",
    invoiceNo: invoice.invoiceNo,
  });

  const updated = await findSaleInvoiceForReconciliationById(invoiceId);
  if (!updated) {
    throw new Error("Không tìm thấy hóa đơn sau khi lưu");
  }

  return buildReconciliationRow(updated);
}

export async function exportReconciliationInvoiceExcelService(invoiceId: number): Promise<Buffer> {
  const invoice = await findSaleInvoiceForReconciliationById(invoiceId);
  if (!invoice) {
    throw new Error("Không tìm thấy hóa đơn bán ra");
  }

  const row = buildReconciliationRow(invoice);
  const company = await getCompanyInfoService();

  return buildReconciliationDetailExcel({
    row,
    company: company ? { name: company.name, address: company.address } : null,
  });
}
