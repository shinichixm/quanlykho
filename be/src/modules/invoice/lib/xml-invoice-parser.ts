import { XMLParser } from "fast-xml-parser";
import type {
  InvoiceType,
  ParsedInvoice,
  ParsedInvoiceItem,
} from "../types/invoice.types";

/**
 * Parser nhắm tới cấu trúc dữ liệu hóa đơn điện tử theo Nghị định 123/2020
 * và Thông tư 78/2021 (khối HDon/DLHDon/NDHDon với NBan, NMua, DSHHDVu, TToan).
 * Vì mỗi phần mềm hóa đơn điện tử (Viettel, VNPT, MISA, BKAV...) có thể bọc
 * thêm lớp thẻ khác nhau, hàm `findFirst` bên dưới tìm theo TÊN thẻ ở bất kỳ
 * độ sâu nào thay vì đòi hỏi đúng 1 đường dẫn cố định.
 */

const parserOptions = {
  ignoreAttributes: true,
  trimValues: true,
  parseTagValue: false,
};

function findFirst(node: unknown, tagName: string): unknown {
  if (node == null || typeof node !== "object") return undefined;

  const obj = node as Record<string, unknown>;
  if (tagName in obj) return obj[tagName];

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findFirst(item, tagName);
        if (found !== undefined) return found;
      }
    } else if (typeof value === "object") {
      const found = findFirst(value, tagName);
      if (found !== undefined) return found;
    }
  }

  return undefined;
}

function findAll(node: unknown, tagName: string): unknown[] {
  const found = findFirst(node, tagName);
  if (found === undefined) return [];
  return Array.isArray(found) ? found : [found];
}

function text(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function num(value: unknown): number {
  const cleaned = text(value).replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

const NO_TAX_CODE_PREFIX = "NOMST-";

export function isPlaceholderTaxCode(taxCode: string): boolean {
  return taxCode.startsWith(NO_TAX_CODE_PREFIX);
}

// Đơn vị không có MST trong file XML: sinh mã định danh nội bộ ổn định
// theo tên đối tác để nhóm đúng về 1 partner giữa các lần nạp hóa đơn,
// đồng thời không đụng vào ràng buộc unique của cột taxCode.
function generatePlaceholderTaxCode(partnerName: string): string {
  const slug = partnerName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${NO_TAX_CODE_PREFIX}${slug || "khong-ro"}`;
}

function parseInvoiceDate(value: unknown): Date {
  const raw = text(value);

  // ISO: 2024-01-15
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // DD/MM/YYYY
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  }

  const fallback = new Date(raw);
  if (!Number.isNaN(fallback.getTime())) return fallback;

  throw new Error(`Không đọc được ngày lập hóa đơn: "${raw}"`);
}

export function parseInvoiceXml(xml: string, type: InvoiceType): ParsedInvoice {
  const parser = new XMLParser(parserOptions);
  const root = parser.parse(xml);

  const seller = findFirst(root, "NBan");
  const buyer = findFirst(root, "NMua");
  const ttChung = findFirst(root, "TTChung");
  const toanBoTien = findFirst(root, "TToan");
  const itemNodes = findAll(root, "HHDVu");

  if (!seller) throw new Error("Không tìm thấy thông tin người bán (NBan) trong file XML");
  if (!buyer) throw new Error("Không tìm thấy thông tin người mua (NMua) trong file XML");
  if (itemNodes.length === 0) throw new Error("Không tìm thấy danh sách hàng hóa/dịch vụ (HHDVu) trong file XML");

  // Hóa đơn mua vào (purchase): đối tác là người bán (NBan).
  // Hóa đơn bán ra (sale): đối tác là người mua (NMua).
  const partnerNode = type === "purchase" ? seller : buyer;

  const invoiceNo = text(findFirst(ttChung, "SHDon") ?? findFirst(root, "SHDon"));
  const invoiceSeries =
    text(findFirst(ttChung, "KHHDon") ?? findFirst(root, "KHHDon")) || null;
  const issuedAtRaw = findFirst(ttChung, "NLap") ?? findFirst(root, "NLap");

  if (!invoiceNo) throw new Error("Không tìm thấy số hóa đơn (SHDon) trong file XML");
  if (!issuedAtRaw) throw new Error("Không tìm thấy ngày lập hóa đơn (NLap) trong file XML");

  const rawPartnerTaxCode = text(findFirst(partnerNode, "MST"));
  // Giới hạn độ dài để không vượt quá kích thước cột trong DB (xem schema.prisma).
  const partnerName = text(findFirst(partnerNode, "Ten")).slice(0, 500);

  if (!partnerName) throw new Error("Không tìm thấy tên đối tác (Ten) trong file XML");

  const partnerTaxCodeMissing = !rawPartnerTaxCode;
  const partnerTaxCode = rawPartnerTaxCode || generatePlaceholderTaxCode(partnerName);

  const items: ParsedInvoiceItem[] = itemNodes
    .map((raw) => {
      // Cắt bớt cho khớp giới hạn cột DB (Product.name VarChar(1000), unit VarChar(255)).
      const name = text(findFirst(raw, "THHDVu")).slice(0, 1000);
      if (!name) return null;

      return {
        name,
        unit: (text(findFirst(raw, "DVTinh")) || "cái").slice(0, 255),
        quantity: num(findFirst(raw, "SLuong")),
        unitPrice: num(findFirst(raw, "DGia")),
        amount: num(findFirst(raw, "ThTien")),
      };
    })
    .filter((item): item is ParsedInvoiceItem => item !== null);

  if (items.length === 0) {
    throw new Error("Danh sách hàng hóa/dịch vụ trong file XML không hợp lệ (thiếu tên hàng)");
  }

  const totalAmountRaw = findFirst(toanBoTien, "TgTTTBSo");
  const totalAmount = totalAmountRaw
    ? num(totalAmountRaw)
    : items.reduce((sum, item) => sum + item.amount, 0);

  return {
    invoiceNo,
    invoiceSeries,
    issuedAt: parseInvoiceDate(issuedAtRaw),
    partnerTaxCode,
    partnerTaxCodeMissing,
    partnerName,
    partnerAddress: text(findFirst(partnerNode, "DChi")).slice(0, 1000) || null,
    totalAmount,
    items,
  };
}
