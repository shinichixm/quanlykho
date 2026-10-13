import ExcelJS from "exceljs";
import { isPlaceholderTaxCode } from "./xml-invoice-parser";
import type { InvoiceType } from "../types/invoice.types";

type CompanyInfo = {
  name: string;
  address: string | null;
} | null;

type InvoiceExportItem = {
  productCode: string;
  productName: string;
  unit: string;
  quantity: { toString(): string };
  unitPrice: { toString(): string };
  amount: { toString(): string };
};

type InvoiceExportRow = {
  invoiceNo: string;
  invoiceSeries: string | null;
  issuedAt: Date;
  totalAmount: { toString(): string };
  status: string;
  partner: { name: string; taxCode: string; address: string | null };
  items: InvoiceExportItem[];
};

const LAST_COLUMN = "M";
const QTY_FORMAT = "#,##0.###";
const MONEY_FORMAT = "#,##0";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFD9E6F5" },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

const STATUS_LABEL: Record<string, string> = {
  new: "Mới",
  processed: "Đã xử lý",
  error: "Lỗi",
};

const TITLE_BY_TYPE: Record<InvoiceType, string> = {
  purchase: "BẢNG KÊ CHI TIẾT HÓA ĐƠN MUA VÀO",
  sale: "BẢNG KÊ CHI TIẾT HÓA ĐƠN BÁN RA",
};

function formatDate(date: Date): string {
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
}

function formatPeriodLabel(dateFrom?: Date, dateTo?: Date): string {
  if (!dateFrom && !dateTo) return "Tất cả thời gian";
  const fromLabel = dateFrom ? formatDate(dateFrom) : "...";
  const toLabel = dateTo ? formatDate(dateTo) : "...";
  return `Từ ngày ${fromLabel} đến ngày ${toLabel}`;
}

export async function buildInvoiceListExcel(params: {
  type: InvoiceType;
  rows: InvoiceExportRow[];
  company: CompanyInfo;
  dateFrom?: Date;
  dateTo?: Date;
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Chi tiết hóa đơn");

  sheet.columns = [
    { key: "stt", width: 6 },
    { key: "invoiceNo", width: 12 },
    { key: "invoiceSeries", width: 12 },
    { key: "issuedAt", width: 12 },
    { key: "taxCode", width: 15 },
    { key: "partnerName", width: 35 },
    { key: "productCode", width: 14 },
    { key: "productName", width: 40 },
    { key: "unit", width: 10 },
    { key: "quantity", width: 11 },
    { key: "unitPrice", width: 14 },
    { key: "amount", width: 14 },
    { key: "invoiceTotal", width: 16 },
  ];

  sheet.getCell("A1").value = `Tên đơn vị: ${params.company?.name || ""}`;
  sheet.getCell("A1").font = { bold: true };
  sheet.getCell("A2").value = `Địa chỉ: ${params.company?.address || ""}`;

  sheet.mergeCells(`A4:${LAST_COLUMN}4`);
  const titleCell = sheet.getCell("A4");
  titleCell.value = TITLE_BY_TYPE[params.type];
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: "center" };

  sheet.mergeCells(`A6:${LAST_COLUMN}6`);
  const periodCell = sheet.getCell("A6");
  periodCell.value = formatPeriodLabel(params.dateFrom, params.dateTo);
  periodCell.font = { bold: true };
  periodCell.alignment = { horizontal: "center" };

  const headerRow = sheet.getRow(8);
  const headers = [
    "STT",
    "Số hóa đơn",
    "Ký hiệu",
    "Ngày lập",
    "Mã số thuế",
    "Đối tác",
    "Mã hàng",
    "Tên hàng",
    "ĐVT",
    "Số lượng",
    "Đơn giá",
    "Thành tiền",
    "Tổng tiền hóa đơn",
  ];
  headers.forEach((label, idx) => {
    headerRow.getCell(idx + 1).value = label;
  });
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = HEADER_FILL;
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = THIN_BORDER;
  });

  let rowIndex = 9;
  let stt = 0;
  let itemAmountSum = 0;
  let invoiceTotalSum = 0;

  for (const invoice of params.rows) {
    invoiceTotalSum += Number(invoice.totalAmount);
    const taxCode = isPlaceholderTaxCode(invoice.partner.taxCode)
      ? "Không MST"
      : invoice.partner.taxCode;

    const items = invoice.items.length > 0 ? invoice.items : [null];

    for (const item of items) {
      stt += 1;
      const excelRow = sheet.getRow(rowIndex);

      excelRow.getCell("A").value = stt;
      excelRow.getCell("B").value = invoice.invoiceNo;
      excelRow.getCell("C").value = invoice.invoiceSeries || "-";
      excelRow.getCell("D").value = formatDate(invoice.issuedAt);
      excelRow.getCell("E").value = taxCode;
      excelRow.getCell("F").value = invoice.partner.name;

      if (item) {
        const amount = Number(item.amount);
        itemAmountSum += amount;

        excelRow.getCell("G").value = item.productCode || "-";
        excelRow.getCell("H").value = item.productName;
        excelRow.getCell("I").value = item.unit;
        excelRow.getCell("J").value = Number(item.quantity);
        excelRow.getCell("K").value = Number(item.unitPrice);
        excelRow.getCell("L").value = amount;
        excelRow.getCell("J").numFmt = QTY_FORMAT;
        excelRow.getCell("K").numFmt = MONEY_FORMAT;
        excelRow.getCell("L").numFmt = MONEY_FORMAT;
      } else {
        excelRow.getCell("H").value = "(Hóa đơn không có dòng hàng)";
      }

      excelRow.getCell("M").value = Number(invoice.totalAmount);
      excelRow.getCell("M").numFmt = MONEY_FORMAT;

      ["A", "D", "E", "G", "I"].forEach((col) => {
        excelRow.getCell(col).alignment = { horizontal: "center" };
      });

      excelRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = THIN_BORDER;
      });

      rowIndex += 1;
    }
  }

  if (stt === 0) {
    sheet.mergeCells(`A${rowIndex}:${LAST_COLUMN}${rowIndex}`);
    const emptyCell = sheet.getCell(`A${rowIndex}`);
    emptyCell.value = "Không có hóa đơn nào khớp bộ lọc";
    emptyCell.alignment = { horizontal: "center" };
  } else {
    const totalRow = sheet.getRow(rowIndex);
    sheet.mergeCells(`A${rowIndex}:K${rowIndex}`);
    totalRow.getCell("A").value = "Tổng cộng";
    totalRow.getCell("A").font = { bold: true };
    totalRow.getCell("A").alignment = { horizontal: "right" };
    totalRow.getCell("L").value = itemAmountSum;
    totalRow.getCell("L").numFmt = MONEY_FORMAT;
    totalRow.getCell("L").font = { bold: true };
    totalRow.getCell("M").value = invoiceTotalSum;
    totalRow.getCell("M").numFmt = MONEY_FORMAT;
    totalRow.getCell("M").font = { bold: true };
    totalRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = THIN_BORDER;
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
