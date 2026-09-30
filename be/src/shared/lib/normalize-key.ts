/**
 * Chuẩn hóa một chuỗi tự do (tên hàng, đơn vị tính lấy từ XML hóa đơn) thành
 * "khóa so khớp" ổn định, để hai chuỗi chỉ khác nhau về khoảng trắng (kể cả dư/thiếu
 * 1 dấu cách ở giữa từ, kiểu "V-K300M" so với "V-K300 M") / kiểu dấu nháy / hoa-thường /
 * ký tự ẩn vẫn được coi là CÙNG một sản phẩm.
 *
 * Dùng cho cột Product.nameKey / Product.unitKey — KHÔNG dùng để hiển thị.
 * Cố ý bỏ TOÀN BỘ khoảng trắng (không chỉ gộp lại) vì nhà cung cấp gõ tay hay dư/thiếu
 * đúng 1 dấu cách ở vị trí bất kỳ trong mã hàng, không chỉ cạnh dấu '-' hay '/'.
 */

// Zero-width space, ZWNJ, ZWJ, word-joiner, BOM.
const ZERO_WIDTH = /[​‌‍⁠﻿]/g;
// Mọi kiểu nháy đơn/cong/backtick -> '
const SINGLE_QUOTES = /[‘’‚‛′`´]/g;
// Mọi kiểu nháy kép/cong/guillemet -> "
const DOUBLE_QUOTES = /[“”„‟″«»]/g;
// Mọi kiểu gạch ngang (hyphen, en/em dash...) -> '-'
const DASHES = /[‐-―]/g;

export function normalizeKey(input: string | null | undefined): string {
  if (!input) return "";

  return input
    .normalize("NFKC") // gộp ký tự tổ hợp, ký tự full-width về dạng chuẩn
    .replace(ZERO_WIDTH, "")
    .replace(SINGLE_QUOTES, "'")
    .replace(DOUBLE_QUOTES, '"')
    .replace(DASHES, "-")
    .replace(/\s+/g, "") // bỏ toàn bộ khoảng trắng (mọi loại: \n, \t, NBSP...)
    .toLowerCase();
}
