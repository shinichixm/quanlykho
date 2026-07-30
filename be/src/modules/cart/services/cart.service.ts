import { getCompanyInfoService } from "../../company/services/company.service";
import { buildCartInvoiceExcel } from "../lib/cart-invoice-excel";
import { cartExportInvoiceSchema } from "../schemas/cart.schema";

export async function exportCartInvoiceExcelService(input: unknown): Promise<Buffer> {
  const parsed = cartExportInvoiceSchema.parse(input);
  const company = await getCompanyInfoService();

  return buildCartInvoiceExcel({
    company: company
      ? { name: company.name, taxCode: company.taxCode, address: company.address, phone: company.phone }
      : null,
    customer: parsed.customer,
    items: parsed.items,
  });
}
