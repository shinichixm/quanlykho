# Module invoice

Nạp hóa đơn điện tử (XML) và tự động sinh phiếu nhập/xuất kho.

## API
- `POST /api/invoices/preview` — multipart form-data: `files` (nhiều file XML), `type` (`purchase` | `sale`)
  → mảng `PreviewInvoiceRow[]` (parse only, **không lưu DB**), mỗi phần tử gồm thông tin hóa đơn + danh sách hàng hóa; nếu 1 file lỗi parse thì `error` khác `null`, các file khác vẫn preview bình thường.
- `POST /api/invoices/confirm` — multipart form-data giống `/preview` → parse lại và **lưu thật vào DB**, trả mảng `ConfirmInvoiceRow[]` (mỗi file thành công/thất bại độc lập).
- `GET /api/invoices?type=purchase|sale&page=&pageSize=` — danh sách hóa đơn theo loại

## Cách hoạt động
1. FE gọi `/preview` trước để hiển thị trước cho người dùng xem (nhóm theo nhà cung cấp, mở rộng xem từng dòng hàng) — bước này **không đụng DB**.
2. Người dùng bấm "Xác nhận" → FE gửi lại đúng các file đó tới `/confirm` → mới thật sự parse + lưu.
3. Parse XML theo cấu trúc dữ liệu hóa đơn điện tử chuẩn NĐ123/TT78 (`lib/xml-invoice-parser.ts`), tìm thẻ theo tên (`NBan`, `NMua`, `HHDVu`, `TToan`...) bất kể độ sâu lồng — chịu được sai khác nhỏ giữa các nhà cung cấp hóa đơn (Viettel, VNPT, MISA...).
4. `type = "purchase"` → đối tác là **người bán** (NBan), sinh `StockTransaction` loại `in` (nhập kho).
   `type = "sale"` → đối tác là **người mua** (NMua), sinh `StockTransaction` loại `out` (xuất kho).
5. Đối tác (`Partner`) tự tạo theo mã số thuế nếu chưa tồn tại.
6. Hàng hóa (`Product`) tự tạo theo **tên + đơn vị tính** nếu chưa khớp sản phẩm nào (sinh mã tự động dạng `AUTO-XXXXXXXX`) — anh nên vào danh mục sản phẩm đổi lại mã cho dễ quản lý sau này.
7. Mỗi hóa đơn (hóa đơn + dòng hàng + phiếu kho + cập nhật tồn) chạy trong **1 transaction DB** riêng — nạp nhiều file cùng lúc, 1 file lỗi không ảnh hưởng các file khác.
8. Hóa đơn trùng (theo số + ký hiệu + đối tác) sẽ bị từ chối nạp lại (báo lỗi ở đúng file đó trong `/confirm`).

## Giới hạn hiện tại (cần biết trước khi test)
- **Chưa chặn xuất kho vượt tồn** — nếu nạp hóa đơn bán ra cho sản phẩm chưa từng nhập, tồn kho sẽ âm. Đây là điều cần bổ sung rule sau.
- XML parser nhắm đúng bộ thẻ chuẩn (`SHDon`, `KHHDon`, `NLap`, `NBan`, `NMua`, `MST`, `Ten`, `DChi`, `HHDVu`, `THHDVu`, `DVTinh`, `SLuong`, `DGia`, `ThTien`, `TgTTTBSo`). Nếu file XML thực tế đặt tên thẻ khác, cần gửi file mẫu để chỉnh `xml-invoice-parser.ts`.
