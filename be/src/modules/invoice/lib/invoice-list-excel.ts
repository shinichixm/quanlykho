import ExcelJS from "exceljs";
import { isPlaceholderTaxCode } from "./xml-invoice-parser";
import type { InvoiceType } from "../types/invoice.types";

type CompanyInfo = {
  name: string;
  address: string | null;
} | null;

type InvoiceExportRow = {
  invoiceNo: string;
  invoiceSeries: string | null;
  issuedAt: Date;
  totalAmount: { toString(): string };
  status: string;
  partner: { name: string; taxCode: string; address: string | null };
};

const LAST_COLUMN = "H";

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
  purchase: "DANH SÁCH HÓA ĐƠN MUA VÀO",
  sale: "DANH SÁCH HÓA ĐƠN BÁN RA",
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
  const sheet = workbook.addWorksheet("Danh sách hóa đơn");

  sheet.columns = [
    { key: "stt", width: 6 },
    { key: "invoiceNo", width: 14 },
    { key: "invoiceSeries", width: 14 },
    { key: "issuedAt", width: 14 },
    { key: "taxCode", width: 16 },
    { key: "partnerName", width: 45 },
    { key: "totalAmount", width: 18 },
    { key: "status", width: 14 },
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
    "Tổng tiền",
    "Trạng thái",
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
  let totalSum = 0;

  for (const [idx, row] of params.rows.entries()) {
    const excelRow = sheet.getRow(rowIndex);
    const amount = Number(row.totalAmount);
    totalSum += amount;

    excelRow.getCell("A").value = idx + 1;
    excelRow.getCell("B").value = row.invoiceNo;
    excelRow.getCell("C").value = row.invoiceSeries || "-";
    excelRow.getCell("D").value = formatDate(row.issuedAt);
    excelRow.getCell("E").value = isPlaceholderTaxCode(row.partner.taxCode)
      ? "Không MST"
      : row.partner.taxCode;
    excelRow.getCell("F").value = row.partner.name;
    excelRow.getCell("G").value = amount;
    excelRow.getCell("G").numFmt = "#,##0";
    excelRow.getCell("H").value = STATUS_LABEL[row.status] || row.status;

    ["A", "D", "E", "H"].forEach((col) => {
      excelRow.getCell(col).alignment = { horizontal: "center" };
    });

    excelRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = THIN_BORDER;
    });

    rowIndex += 1;
  }

  if (params.rows.length === 0) {
    sheet.mergeCells(`A${rowIndex}:${LAST_COLUMN}${rowIndex}`);
    const emptyCell = sheet.getCell(`A${rowIndex}`);
    emptyCell.value = "Không có hóa đơn nào khớp bộ lọc";
    emptyCell.alignment = { horizontal: "center" };
    rowIndex += 1;
  } else {
    const totalRow = sheet.getRow(rowIndex);
    sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
    totalRow.getCell("A").value = "Tổng cộng";
    totalRow.getCell("A").font = { bold: true };
    totalRow.getCell("A").alignment = { horizontal: "right" };
    totalRow.getCell("G").value = totalSum;
    totalRow.getCell("G").numFmt = "#,##0";
    totalRow.getCell("G").font = { bold: true };
    totalRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = THIN_BORDER;
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
