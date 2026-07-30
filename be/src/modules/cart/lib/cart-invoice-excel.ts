import ExcelJS from "exceljs";
import type { CartExportInvoiceInput } from "../schemas/cart.schema";

type CompanyInfo = {
  name: string;
  taxCode: string | null;
  address: string | null;
  phone: string | null;
} | null;

const LAST_COLUMN = "G";
const QTY_FORMAT = "#,##0.00";
const VALUE_FORMAT = "#,##0";

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

export async function buildCartInvoiceExcel(params: {
  company: CompanyInfo;
  customer: CartExportInvoiceInput["customer"];
  items: CartExportInvoiceInput["items"];
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Phiếu xuất kho");

  sheet.columns = [
    { key: "stt", width: 6 },
    { key: "code", width: 16 },
    { key: "name", width: 40 },
    { key: "unit", width: 10 },
    { key: "quantity", width: 12 },
    { key: "unitPrice", width: 14 },
    { key: "amount", width: 16 },
  ];

  sheet.getCell("A1").value = `Đơn vị bán hàng: ${params.company?.name || ""}`;
  sheet.getCell("A1").font = { bold: true };
  sheet.getCell("A2").value = `Mã số thuế: ${params.company?.taxCode || ""}`;
  sheet.getCell("A3").value = `Địa chỉ: ${params.company?.address || ""}`;

  sheet.mergeCells(`A5:${LAST_COLUMN}5`);
  const titleCell = sheet.getCell("A5");
  titleCell.value = "PHIẾU XUẤT KHO";
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: "center" };

  sheet.mergeCells(`A6:${LAST_COLUMN}6`);
  const dateCell = sheet.getCell("A6");
  dateCell.value = `Ngày lập: ${new Date().toLocaleDateString("vi-VN")}`;
  dateCell.alignment = { horizontal: "center" };

  sheet.getCell("A8").value = `Khách hàng: ${params.customer.name}`;
  sheet.getCell("A8").font = { bold: true };
  sheet.getCell("A9").value = `Mã số thuế: ${params.customer.taxCode || ""}`;
  sheet.getCell("A10").value = `Địa chỉ: ${params.customer.address || ""}`;

  const headerRow = sheet.getRow(12);
  const headers = ["STT", "Mã hàng", "Tên hàng", "ĐVT", "Số lượng", "Đơn giá", "Thành tiền"];
  ["A", "B", "C", "D", "E", "F", "G"].forEach((col, idx) => {
    headerRow.getCell(col).value = headers[idx];
  });
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = HEADER_FILL;
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = THIN_BORDER;
  });

  let rowIndex = 13;
  let totalAmount = 0;
  params.items.forEach((item, idx) => {
    const amount = item.quantity * item.unitPrice;
    totalAmount += amount;

    const excelRow = sheet.getRow(rowIndex);
    excelRow.getCell("A").value = idx + 1;
    excelRow.getCell("B").value = item.code;
    excelRow.getCell("C").value = item.name;
    excelRow.getCell("D").value = item.unit;
    excelRow.getCell("E").value = item.quantity;
    excelRow.getCell("F").value = item.unitPrice;
    excelRow.getCell("G").value = amount;

    excelRow.getCell("E").numFmt = QTY_FORMAT;
    excelRow.getCell("F").numFmt = VALUE_FORMAT;
    excelRow.getCell("G").numFmt = VALUE_FORMAT;
    ["A", "D"].forEach((col) => {
      excelRow.getCell(col).alignment = { horizontal: "center" };
    });
    ["E", "F", "G"].forEach((col) => {
      excelRow.getCell(col).alignment = { horizontal: "right" };
    });

    excelRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = THIN_BORDER;
    });

    rowIndex += 1;
  });

  sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
  const totalLabelCell = sheet.getCell(`A${rowIndex}`);
  totalLabelCell.value = "Tổng cộng";
  totalLabelCell.font = { bold: true };
  totalLabelCell.alignment = { horizontal: "right" };

  const totalValueCell = sheet.getCell(`G${rowIndex}`);
  totalValueCell.value = totalAmount;
  totalValueCell.numFmt = VALUE_FORMAT;
  totalValueCell.font = { bold: true };
  totalValueCell.alignment = { horizontal: "right" };

  sheet.getRow(rowIndex).eachCell({ includeEmpty: true }, (cell) => {
    cell.border = THIN_BORDER;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
