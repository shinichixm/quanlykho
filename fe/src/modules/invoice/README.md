# Module invoice (FE)

Upload hóa đơn điện tử XML (1 hoặc nhiều file), xem trước theo nhà cung cấp, xác nhận mới lưu vào DB.

## Luồng
1. Chọn file (có thể chọn nhiều) → gọi `POST /api/invoices/preview` → chỉ parse, không lưu.
2. `InvoicePreviewPanel` hiển thị **ngay trong trang** (không phải popup), nằm dưới nút "Nạp hóa đơn XML" — nhóm hóa đơn theo nhà cung cấp/khách hàng (dựa vào mã số thuế), mỗi hóa đơn có nút mũi tên mở rộng để xem danh sách hàng hóa bên trong.
3. File nào parse lỗi vẫn hiển thị (mục lỗi riêng), không chặn các file hợp lệ khác.
4. Bấm "Xác nhận nạp N hóa đơn" → gửi lại đúng các file đó tới `POST /api/invoices/confirm` → mới thật sự lưu.

## Thành phần
- `components/InvoiceFilePicker.tsx` — nút chọn file (nhiều file), báo lên qua callback
- `components/InvoicePreviewPanel.tsx` — Card hiển thị preview inline, nhóm theo nhà cung cấp, expand/collapse từng hóa đơn
- `components/InvoiceTable.tsx` — bảng danh sách hóa đơn đã lưu
- `hooks/useInvoiceImport.ts` — quản lý state của cả luồng preview → confirm
- `hooks/useInvoiceList.ts` — tải danh sách theo `type` (`purchase` | `sale`)
- `services/invoice.api.ts` — gọi `/preview`, `/confirm`, `GET /api/invoices`

## Dùng ở
- `app/(app)/invoices-in/page.tsx` (`type="purchase"`)
- `app/(app)/invoices-out/page.tsx` (`type="sale"`)
