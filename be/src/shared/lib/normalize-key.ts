/**
 * Chuẩn hóa một chuỗi tự do (tên hàng, đơn vị tính lấy từ XML hóa đơn) thành
 * "khóa so khớp" ổn định, để hai chuỗi chỉ khác nhau về khoảng trắng / kiểu dấu
 * nháy / hoa-thường / ký tự ẩn vẫn được coi là CÙNG một sản phẩm.
 *
 * Dùng cho cột Product.nameKey / Product.unitKey — KHÔNG dùng để hiển thị.
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
    .replace(/\s+/g, " ") // gộp mọi loại khoảng trắng (kể cả \n, \t, NBSP) thành 1 dấu cách
    // Bỏ khoảng trắng bao quanh '-' và '/': nhà cung cấp gõ "4- port", "4 -port",
    // "512E/ HPE", "512E /HPE"... cho cùng một nội dung.
    .replace(/ ?([/-]) ?/g, "$1")
    .trim()
    .toLowerCase();
}
