import ExcelJS from "exceljs";

export type ParsedProductImportRow = {
  rowIndex: number; // số dòng trong file Excel (tính cả header) để người dùng dễ đối chiếu
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  error: string | null;
};

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "object") {
    if ("text" in value && typeof (value as { text?: unknown }).text === "string") {
      return (value as { text: string }).text.trim();
    }
    if ("result" in value) return String((value as { result?: unknown }).result ?? "").trim();
    return "";
  }
  return String(value).trim();
}

function cellNumber(text: string): number {
  const n = Number(text.replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

export async function parseProductImportExcel(buffer: Buffer): Promise<ParsedProductImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  // exceljs resolve kiểu Buffer từ 1 bản @types/node khác trong cây node_modules
  // (xung đột version) -> ép kiểu any để qua type-check, giá trị runtime vẫn đúng Buffer.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(buffer as any);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error("File Excel không có sheet nào");
  }

  const rows: ParsedProductImportRow[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // dòng tiêu đề

    const name = cellText(row.getCell(1).value);
    const unit = cellText(row.getCell(2).value);
    const unitPriceText = cellText(row.getCell(3).value);
    const quantityText = cellText(row.getCell(4).value);

    const isEmptyRow = !name && !unit && !unitPriceText && !quantityText;
    if (isEmptyRow) return;

    const unitPrice = unitPriceText ? cellNumber(unitPriceText) : 0;
    const quantity = quantityText ? cellNumber(quantityText) : 0;

    let error: string | null = null;
    if (!name) error = "Thiếu tên hàng";
    else if (!unit) error = "Thiếu đơn vị tính";
    else if (Number.isNaN(unitPrice)) error = "Giá nhập không hợp lệ";
    else if (Number.isNaN(quantity)) error = "Số lượng không hợp lệ";
    else if (unitPrice < 0) error = "Giá nhập không được âm";
    else if (quantity < 0) error = "Số lượng không được âm";

    rows.push({
      rowIndex: rowNumber,
      name,
      unit,
      unitPrice: Number.isNaN(unitPrice) ? 0 : unitPrice,
      quantity: Number.isNaN(quantity) ? 0 : quantity,
      error,
    });
  });

  return rows;
}

export async function buildProductImportTemplateExcel(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sản phẩm");

  sheet.columns = [
    { header: "Tên hàng", key: "name", width: 45 },
    { header: "Đơn vị tính", key: "unit", width: 16 },
    { header: "Giá nhập", key: "unitPrice", width: 16 },
    { header: "Số lượng", key: "quantity", width: 14 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9E6F5" },
  };

  sheet.addRow({
    name: "VD: Bàn phím máy tính Logitech K120",
    unit: "Cái",
    unitPrice: 150000,
    quantity: 10,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
