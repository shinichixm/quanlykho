import { getInventoryTotalValueService } from "../../inventory/services/inventory.service";
import {
  countInvoicesByTypeInRange,
  countProducts,
  findRecentInvoices,
} from "../repositories/dashboard.repository";
import type { DashboardSummary } from "../types/dashboard.types";

function currentMonthRange() {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { from, to };
}

export async function getDashboardSummaryService(): Promise<DashboardSummary> {
  const { from, to } = currentMonthRange();

  const [totalProducts, invoicesInThisMonth, invoicesOutThisMonth, inventoryValue, recentInvoices] =
    await Promise.all([
      countProducts(),
      countInvoicesByTypeInRange("purchase", from, to),
      countInvoicesByTypeInRange("sale", from, to),
      getInventoryTotalValueService(),
      findRecentInvoices(8),
    ]);

  return {
    totalProducts,
    invoicesInThisMonth,
    invoicesOutThisMonth,
    inventoryValue,
    recentActivities: recentInvoices.map((invoice) => ({
      id: invoice.id,
      type: invoice.type as "purchase" | "sale",
      invoiceNo: invoice.invoiceNo,
      partnerName: invoice.partner.name,
      issuedAt: invoice.issuedAt,
      totalAmount: invoice.totalAmount.toString(),
    })),
  };
}
