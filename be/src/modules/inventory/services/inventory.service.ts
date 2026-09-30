import { getCompanyInfoService } from "../../company/services/company.service";
import { buildInventoryReportExcel } from "../lib/inventory-report-excel";
import {
  createInventoryAdjustment,
  findInventoryReportData,
} from "../repositories/inventory.repository";
import { findProductById } from "../../product/repositories/product.repository";
import {
  inventoryAdjustmentInputSchema,
  inventoryListQuerySchema,
} from "../schemas/inventory.schema";
import type { InventoryListResult, InventoryRow, InventoryStatus } from "../types/inventory.types";

type PeriodInput = {
  keyword?: string;
  status?: InventoryStatus;
  periodFrom?: string;
  periodTo?: string;
};

function toEndOfDayUtc(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999)
  );
}

async function computeInventoryRows(
  input: PeriodInput
): Promise<{ rows: InventoryRow[]; periodFrom?: Date; periodTo?: Date }> {
  const parsed = inventoryListQuerySchema.parse({
    keyword: input.keyword || undefined,
    status: input.status,
    periodFrom: input.periodFrom || undefined,
    periodTo: input.periodTo || undefined,
  });

  const periodTo = parsed.periodTo ? toEndOfDayUtc(parsed.periodTo) : undefined;
  const periodFrom = parsed.periodFrom;

  const { products, purchaseItems, saleItems, adjustments } = await findInventoryReportData({
    keyword: parsed.keyword,
    periodTo,
  });

  const rows: InventoryRow[] = products.map((product) => {
    const pItems = purchaseItems.filter((item) => item.productId === product.id);
    const sItems = saleItems.filter((item) => item.productId === product.id);
    const productAdjustments = adjustments.filter((a) => a.productId === product.id);

    // Phiếu điều chỉnh dương tính như 1 lần nhập (có ảnh hưởng giá vốn bình quân),
    // phiếu âm tính như 1 lần xuất (chỉ trừ số lượng, không đổi giá vốn).
    const posAdj = productAdjustments.filter((a) => Number(a.quantity) > 0);
    const negAdj = productAdjustments.filter((a) => Number(a.quantity) < 0);

    const totalPurchasedQty =
      pItems.reduce((sum, item) => sum + Number(item.quantity), 0) +
      posAdj.reduce((sum, a) => sum + Number(a.quantity), 0);
    const totalPurchasedAmount =
      pItems.reduce((sum, item) => sum + Number(item.amount), 0) +
      posAdj.reduce((sum, a) => sum + Number(a.quantity) * Number(a.unitPrice), 0);
    const avgCost = totalPurchasedQty > 0 ? totalPurchasedAmount / totalPurchasedQty : 0;

    const isBeforePeriod = (at: Date) => (periodFrom ? at < periodFrom : false);

    const openingQty =
      pItems
        .filter((item) => isBeforePeriod(item.invoice.issuedAt))
        .reduce((sum, item) => sum + Number(item.quantity), 0) +
      posAdj
        .filter((a) => isBeforePeriod(a.adjustedAt))
        .reduce((sum, a) => sum + Number(a.quantity), 0) -
      (sItems
        .filter((item) => isBeforePeriod(item.invoice.issuedAt))
        .reduce((sum, item) => sum + Number(item.quantity), 0) +
        negAdj
          .filter((a) => isBeforePeriod(a.adjustedAt))
          .reduce((sum, a) => sum + Math.abs(Number(a.quantity)), 0));

    const inItems = pItems.filter((item) => !isBeforePeriod(item.invoice.issuedAt));
    const outItems = sItems.filter((item) => !isBeforePeriod(item.invoice.issuedAt));
    const inAdj = posAdj.filter((a) => !isBeforePeriod(a.adjustedAt));
    const outAdj = negAdj.filter((a) => !isBeforePeriod(a.adjustedAt));

    const inQty =
      inItems.reduce((sum, item) => sum + Number(item.quantity), 0) +
      inAdj.reduce((sum, a) => sum + Number(a.quantity), 0);
    const inValue =
      inItems.reduce((sum, item) => sum + Number(item.amount), 0) +
      inAdj.reduce((sum, a) => sum + Number(a.quantity) * Number(a.unitPrice), 0);
    const outQty =
      outItems.reduce((sum, item) => sum + Number(item.quantity), 0) +
      outAdj.reduce((sum, a) => sum + Math.abs(Number(a.quantity)), 0);

    const openingValue = openingQty * avgCost;
    const outValue = outQty * avgCost;
    const closingQty = openingQty + inQty - outQty;
    const closingValue = openingValue + inValue - outValue;

    return {
      productId: product.id,
      code: product.code,
      name: product.name,
      unit: product.unit,
      avgCost: avgCost.toString(),
      openingQty: openingQty.toString(),
      openingValue: openingValue.toString(),
      inQty: inQty.toString(),
      inValue: inValue.toString(),
      outQty: outQty.toString(),
      outValue: outValue.toString(),
      closingQty: closingQty.toString(),
      closingValue: closingValue.toString(),
      status: closingQty > 0 ? "in_stock" : "out_of_stock",
    };
  });

  const filteredRows = parsed.status ? rows.filter((row) => row.status === parsed.status) : rows;

  return { rows: filteredRows, periodFrom, periodTo };
}

export async function listInventoryService(
  input: PeriodInput & { page?: number; pageSize?: number }
): Promise<InventoryListResult> {
  const { rows } = await computeInventoryRows(input);

  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 50;
  const start = (page - 1) * pageSize;

  return {
    rows: rows.slice(start, start + pageSize),
    total: rows.length,
  };
}

export async function getInventoryTotalValueService(): Promise<number> {
  const { rows } = await computeInventoryRows({});
  return rows.reduce((sum, row) => sum + Number(row.closingValue), 0);
}

export async function exportInventoryReportExcelService(input: PeriodInput): Promise<Buffer> {
  const { rows, periodFrom, periodTo } = await computeInventoryRows(input);
  const company = await getCompanyInfoService();

  return buildInventoryReportExcel({
    rows,
    company: company ? { name: company.name, address: company.address } : null,
    periodFrom,
    periodTo,
  });
}

export async function createInventoryAdjustmentService(input: unknown) {
  const parsed = inventoryAdjustmentInputSchema.parse(input);

  const product = await findProductById(parsed.productId);
  if (!product) {
    throw new Error("Không tìm thấy sản phẩm");
  }

  return createInventoryAdjustment(parsed);
}
