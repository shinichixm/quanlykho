import ExcelJS from "exceljs";
import type { ReconciliationInvoiceRow } from "../types/reconciliation.types";

type CompanyInfo = {
  name: string;
  address: string | null;
} | null;

const LAST_COLUMN = "H";
const QTY_FORMAT = "#,##0.00";

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

const STATUS_LABEL: Record<ReconciliationInvoiceRow["status"], string> = {
  completed: "Hoàn thành",
  negative_stock: "Âm kho",
};

const SUBSTITUTION_STATUS_LABEL: Record<"draft" | "completed", string> = {
  draft: "Lưu tạm",
  completed: "Đã trừ kho",
};

function formatDate(date: Date): string {
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
}

export async function buildReconciliationDetailExcel(params: {
  row: ReconciliationInvoiceRow;
  company: CompanyInfo;
}): Promise<Buffer> {
  const { row } = params;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Chi tiết bổ sung");

  sheet.columns = [
    { key: "stt", width: 6 },
    { key: "originalProduct", width: 40 },
    { key: "quantitySold", width: 12 },
    { key: "substituteCode", width: 16 },
    { key: "substituteName", width: 40 },
    { key: "unit", width: 10 },
    { key: "quantity", width: 12 },
    { key: "status", width: 14 },
  ];

  sheet.getCell("A1").value = `Tên đơn vị: ${params.company?.name || ""}`;
  sheet.getCell("A1").font = { bold: true };
  sheet.getCell("A2").value = `Địa chỉ: ${params.company?.address || ""}`;

  sheet.mergeCells(`A4:${LAST_COLUMN}4`);
  const titleCell = sheet.getCell("A4");
  titleCell.value = "CHI TIẾT BỔ SUNG THAY THẾ HÓA ĐƠN";
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: "center" };

  sheet.getCell("A6").value = "Số hóa đơn:";
  sheet.getCell("A6").font = { bold: true };
  sheet.getCell("B6").value = row.invoiceNo;
  sheet.getCell("D6").value = "Ký hiệu:";
  sheet.getCell("D6").font = { bold: true };
  sheet.getCell("E6").value = row.invoiceSeries || "-";

  sheet.getCell("A7").value = "Ngày lập:";
  sheet.getCell("A7").font = { bold: true };
  sheet.getCell("B7").value = formatDate(row.issuedAt);
  sheet.getCell("D7").value = "Đối tác:";
  sheet.getCell("D7").font = { bold: true };
  sheet.getCell("E7").value = row.partnerName;

  sheet.getCell("A8").value = "Tổng tiền:";
  sheet.getCell("A8").font = { bold: true };
  sheet.getCell("B8").value = Number(row.totalAmount);
  sheet.getCell("B8").numFmt = "#,##0";
  sheet.getCell("D8").value = "Trạng thái tra soát:";
  sheet.getCell("D8").font = { bold: true };
  sheet.getCell("E8").value = STATUS_LABEL[row.status];

  const headerRow = sheet.getRow(10);
  const headers = [
    "STT",
    "Sản phẩm gốc (âm kho)",
    "SL bán",
    "Mã hàng thay thế",
    "Sản phẩm thay thế",
    "ĐVT",
    "SL bổ sung",
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

  let rowIndex = 11;
  let stt = 1;

  for (const item of row.items) {
    if (item.substitutions.length === 0) continue;

    for (const sub of item.substitutions) {
      const excelRow = sheet.getRow(rowIndex);
      excelRow.getCell("A").value = stt;
      excelRow.getCell("B").value = item.productName;
      excelRow.getCell("C").value = Number(item.quantitySold);
      excelRow.getCell("D").value = sub.substituteProductCode;
      excelRow.getCell("E").value = sub.substituteProductName;
      excelRow.getCell("F").value = item.unit;
      excelRow.getCell("G").value = Number(sub.quantity);
      excelRow.getCell("H").value = SUBSTITUTION_STATUS_LABEL[sub.status];

      excelRow.getCell("C").numFmt = QTY_FORMAT;
      excelRow.getCell("G").numFmt = QTY_FORMAT;
      ["A", "C", "F", "G", "H"].forEach((col) => {
        excelRow.getCell(col).alignment = { horizontal: "center" };
      });

      excelRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = THIN_BORDER;
      });

      rowIndex += 1;
      stt += 1;
    }
  }

  if (stt === 1) {
    sheet.mergeCells(`A${rowIndex}:${LAST_COLUMN}${rowIndex}`);
    const emptyCell = sheet.getCell(`A${rowIndex}`);
    emptyCell.value = "Chưa có sản phẩm thay thế nào được bổ sung cho hóa đơn này";
    emptyCell.alignment = { horizontal: "center" };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
