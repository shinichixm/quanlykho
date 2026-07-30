import ExcelJS from "exceljs";
import type { InventoryRow } from "../types/inventory.types";

type CompanyInfo = {
  name: string;
  address: string | null;
} | null;

const LAST_COLUMN = "L";
const QTY_FORMAT = "#,##0.00";
const VALUE_FORMAT = "#,##0.0";

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

function formatPeriodLabel(periodFrom?: Date, periodTo?: Date): string {
  if (!periodFrom && !periodTo) return "Tất cả thời gian";

  const format = (date: Date) =>
    `${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;

  const fromLabel = periodFrom ? format(periodFrom) : "...";
  const toLabel = periodTo ? format(periodTo) : "...";

  return `Từ kỳ : ${fromLabel} – Đến kỳ: ${toLabel}`;
}

export async function buildInventoryReportExcel(params: {
  rows: InventoryRow[];
  company: CompanyInfo;
  periodFrom?: Date;
  periodTo?: Date;
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Tồn kho", {
    views: [{ state: "frozen", ySplit: 11 }],
  });

  sheet.columns = [
    { key: "stt", width: 6 },
    { key: "code", width: 16 },
    { key: "name", width: 45 },
    { key: "unit", width: 10 },
    { key: "openingQty", width: 12 },
    { key: "openingValue", width: 14 },
    { key: "inQty", width: 12 },
    { key: "inValue", width: 14 },
    { key: "outQty", width: 12 },
    { key: "outValue", width: 14 },
    { key: "closingQty", width: 12 },
    { key: "closingValue", width: 14 },
  ];

  sheet.getCell("A1").value = `Tên đơn vị: ${params.company?.name || ""}`;
  sheet.getCell("A1").font = { bold: true };
  sheet.getCell("A2").value = `Địa chỉ: ${params.company?.address || ""}`;

  sheet.mergeCells(`A4:${LAST_COLUMN}4`);
  const titleCell = sheet.getCell("A4");
  titleCell.value = "BÁO CÁO NHẬP XUẤT TỒN";
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: "center" };

  sheet.mergeCells(`A6:${LAST_COLUMN}6`);
  const scopeCell = sheet.getCell("A6");
  scopeCell.value = "Tất cả kho hàng";
  scopeCell.font = { bold: true };
  scopeCell.alignment = { horizontal: "center" };

  sheet.mergeCells(`A8:${LAST_COLUMN}8`);
  const periodCell = sheet.getCell("A8");
  periodCell.value = formatPeriodLabel(params.periodFrom, params.periodTo);
  periodCell.font = { bold: true };
  periodCell.alignment = { horizontal: "center" };

  const headerRow1 = sheet.getRow(10);
  const headerRow2 = sheet.getRow(11);

  const groupHeaders: [string, string][] = [
    ["E10", "Tồn đầu kỳ"],
    ["G10", "Nhập trong kỳ"],
    ["I10", "Xuất trong kỳ"],
    ["K10", "Tồn cuối"],
  ];
  sheet.mergeCells("E10:F10");
  sheet.mergeCells("G10:H10");
  sheet.mergeCells("I10:J10");
  sheet.mergeCells("K10:L10");
  for (const [ref, label] of groupHeaders) {
    sheet.getCell(ref).value = label;
  }

  const verticalHeaders: [string, string][] = [
    ["A10", "STT"],
    ["B10", "Mã hàng"],
    ["C10", "Tên hàng"],
    ["D10", "Đơn vị tính"],
  ];
  for (const [ref, label] of verticalHeaders) {
    const col = ref[0];
    sheet.mergeCells(`${col}10:${col}11`);
    sheet.getCell(ref).value = label;
  }

  const subHeaders = ["Số lượng", "Thành tiền", "Số lượng", "Thành tiền", "Số lượng", "Thành tiền", "Số lượng", "Thành tiền"];
  ["E", "F", "G", "H", "I", "J", "K", "L"].forEach((col, idx) => {
    headerRow2.getCell(col).value = subHeaders[idx];
  });

  for (const row of [headerRow1, headerRow2]) {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = HEADER_FILL;
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = THIN_BORDER;
    });
  }

  let rowIndex = 12;
  params.rows.forEach((row, idx) => {
    const excelRow = sheet.getRow(rowIndex);
    excelRow.getCell("A").value = idx + 1;
    excelRow.getCell("B").value = row.code;
    excelRow.getCell("C").value = row.name;
    excelRow.getCell("D").value = row.unit;
    excelRow.getCell("E").value = Number(row.openingQty);
    excelRow.getCell("F").value = Number(row.openingValue);
    excelRow.getCell("G").value = Number(row.inQty);
    excelRow.getCell("H").value = Number(row.inValue);
    excelRow.getCell("I").value = Number(row.outQty);
    excelRow.getCell("J").value = Number(row.outValue);
    excelRow.getCell("K").value = Number(row.closingQty);
    excelRow.getCell("L").value = Number(row.closingValue);

    ["E", "G", "I", "K"].forEach((col) => {
      excelRow.getCell(col).numFmt = QTY_FORMAT;
    });
    ["F", "H", "J", "L"].forEach((col) => {
      excelRow.getCell(col).numFmt = VALUE_FORMAT;
    });
    ["A", "D"].forEach((col) => {
      excelRow.getCell(col).alignment = { horizontal: "center" };
    });
    ["E", "F", "G", "H", "I", "J", "K", "L"].forEach((col) => {
      excelRow.getCell(col).alignment = { horizontal: "right" };
    });
    ["K", "L"].forEach((col) => {
      excelRow.getCell(col).font = { bold: true };
    });

    excelRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = THIN_BORDER;
    });

    rowIndex += 1;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
