# Project Starter FE/BE riêng - TypeScript

Bộ khung mẫu cho dự án tách:
- `fe/` -> frontend Next.js + TypeScript
- `be/` -> backend Node.js + Express + TypeScript
- `docs/` -> tài liệu

## Mục tiêu
- Dùng TypeScript ngay từ đầu
- Dễ chia module theo tính năng
- Dễ tái sử dụng source về sau

## Cách dùng
1. Giải nén bộ khung này
2. Vào `fe/` và `be/` chạy `npm install`
3. Đổi tên module `sample-module` thành module thật như `auth`, `user`, `payroll`
4. Đọc:
   - `MODULE_TODO_CHECKLIST.md`
   - `checklist-tach-fe-be-rieng.md`

## Gợi ý
- FE: UI / hooks / services / types
- BE: routes / services / repositories / schemas / types
- Business logic quan trọng nên đặt ở BE

---

## Mục tiêu dự án thực tế
Xây phần mềm quản lý **xuất nhập tồn kho** dựa vào **hóa đơn điện tử**.

Phạm vi đã chốt:
- 1 kho duy nhất (không quản lý nhiều kho)
- Nạp hóa đơn bằng cách **upload file XML** (chuẩn NĐ123/TT78), không quản lý theo lô/hạn sử dụng
- Hóa đơn mua vào (`purchase`) → sinh phiếu **nhập kho**; hóa đơn bán ra (`sale`) → sinh phiếu **xuất kho**

## Tài khoản đăng nhập (dev/local)
- Đăng nhập bằng **username**, không dùng email
- Tài khoản admin mặc định: `admin` / `123456` (seed trong `be/prisma/seed.ts`)

## Ports khi dev
- BE: `http://localhost:4000`
- FE: `http://localhost:3000`
- Nếu báo lỗi `EADDRINUSE`, có tiến trình cũ chưa tắt — tìm PID bằng `netstat -ano | grep ":4000"` (hoặc `:3000`) rồi kill.

## Chạy dự án (local)
```bash
# BE
cd be
npm install
npm run prisma:migrate   # tạo bảng theo schema.prisma
npm run prisma:seed      # tạo tài khoản admin
npm run dev               # http://localhost:4000

# FE
cd fe
npm install
npm run dev               # http://localhost:3000
```
Nhớ tạo file `.env` (copy từ `.env.example`) ở cả `be/` và `fe/` với giá trị thật trước khi chạy.

## Nhật ký đã làm (để lần sau đọc lại và làm tiếp)

### 1. Database (Prisma, MySQL)
- `be/prisma/schema.prisma` có các model: `User`, `Product`, `Partner`, `Invoice`, `InvoiceItem`, `StockTransaction`, `Inventory`, `CompanyInfo`, `ReconciliationSubstitution`.
- `User`: `username` (unique, dùng đăng nhập — **không dùng email**), `email` (tùy chọn), `password` (bcrypt hash), `fullName`, `role` (enum `ADMIN`/`STAFF`), `isActive`.
- `Invoice.type`: `"purchase"` | `"sale"`. Unique theo `[invoiceSeries, invoiceNo, partnerId]` để chặn nạp trùng. Có thêm field `reconciliationResolvedAt DateTime?` (xem mục Tra soát hóa đơn bên dưới).
- `CompanyInfo`: bảng **singleton** (chỉ 1 dòng) lưu tên/địa chỉ/MST/SĐT/email công ty đang dùng phần mềm, dùng làm tiêu đề khi xuất báo cáo Excel.
- `ReconciliationSubstitution`: ghi nhận sản phẩm thay thế được "bổ sung" cho 1 dòng hàng bán ra bị âm kho (xem mục Tra soát hóa đơn).
- Nguyên tắc đã áp dụng: mọi thay đổi `Inventory.quantity` đi kèm 1 `StockTransaction`, cả hai cùng nằm trong **1 Prisma transaction** với việc tạo/xóa `Invoice`/`InvoiceItem` (xem `be/src/modules/invoice/repositories/invoice.repository.ts` → `importInvoiceTransaction`, `deleteInvoiceById`, `deleteInvoicesByIds`).
- Đã chạy các migration nối tiếp cho `CompanyInfo` và `ReconciliationSubstitution` — nếu pull code mới nhớ chạy lại `npm run prisma:migrate` (hoặc `npx prisma migrate dev`) ở `be/`.
- **Lưu ý Windows/dev**: nếu `prisma migrate`/`prisma generate` báo lỗi `EPERM ... query_engine-windows.dll.node` là do tiến trình `tsx watch` (backend dev server) đang giữ file — phải **tắt hẳn** tiến trình backend (kể cả tiến trình con orphan, kiểm tra bằng `Get-CimInstance Win32_Process -Filter "Name='node.exe'"` trong PowerShell) trước khi migrate, xong mới `npm run dev` lại.

### 2. Backend (`be/`)
- Module `product`: CRUD danh mục hàng hóa đầy đủ, có check trùng mã hàng. Route được bảo vệ bởi `authMiddleware`.
- Module `auth`: `POST /api/auth/login` (username + password → JWT 7 ngày), `GET /api/auth/me`. `shared/middleware/auth.middleware.ts` verify JWT thật.
- Module `partner`: chưa có route riêng, chỉ dùng nội bộ bởi `invoice` để tự tạo/tìm đối tác theo mã số thuế.
- Module `invoice` (đã xong phần lõi + nhiều tính năng quản lý danh sách):
  - `POST /api/invoices/preview` — nhận nhiều file XML, **chỉ parse không lưu DB**, trả về từng hóa đơn + danh sách hàng hóa, file lỗi vẫn trả về kèm `error` (không chặn các file khác).
  - `POST /api/invoices/confirm` — nhận lại đúng các file đó, parse lại và **lưu thật** (mỗi hóa đơn 1 transaction độc lập, 1 hóa đơn lỗi không ảnh hưởng hóa đơn khác).
  - `GET /api/invoices?type=purchase|sale&page=&pageSize=&dateFrom=&dateTo=&partnerId=&productKeyword=` — danh sách hóa đơn, có phân trang + lọc theo khoảng ngày, theo công ty (đối tác), theo tên/mã sản phẩm có trong hóa đơn. Response có thêm `totalAmountSum` (tổng tiền của **toàn bộ** kết quả khớp filter, không chỉ trang hiện tại).
  - `GET /api/invoices/partners?type=` — danh sách công ty (đối tác) đã từng có hóa đơn loại đó, dùng cho dropdown lọc.
  - `GET /api/invoices/:id` — chi tiết đầy đủ 1 hóa đơn (đối tác + toàn bộ dòng hàng).
  - `DELETE /api/invoices/:id` — xóa 1 hóa đơn, **tự động hoàn tác tồn kho** (dọn `InvoiceItem`/`StockTransaction`, đảo ngược `Inventory.quantity`) trong 1 transaction.
  - `DELETE /api/invoices/bulk` (body `{ ids: number[] }`) — xóa nhiều hóa đơn cùng lúc, cùng cơ chế hoàn tác.
  - Parser XML: `be/src/modules/invoice/lib/xml-invoice-parser.ts`, nhắm đúng bộ thẻ chuẩn NĐ123/TT78 (`SHDon`, `KHHDon`, `NLap`, `NBan`, `NMua`, `MST`, `Ten`, `DChi`, `HHDVu`, `THHDVu`, `DVTinh`, `SLuong`, `DGia`, `ThTien`, `TgTTTBSo`), tìm thẻ theo tên bất kể độ sâu lồng — **đã test với file XML thật của nhà cung cấp, đọc đúng**.
  - **Đối tác không có MST trong XML**: không còn bị chặn nạp — tự sinh mã định danh nội bộ ổn định `NOMST-<slug-tên>` (hàm `generatePlaceholderTaxCode`/`isPlaceholderTaxCode` trong `xml-invoice-parser.ts`) để nhóm đúng về 1 partner giữa các lần nạp mà không đụng ràng buộc `@unique` trên `taxCode`; khi hiển thị (preview + chi tiết hóa đơn) sẽ show chữ **"Không MST"** thay vì lộ mã nội bộ.
  - Hàng hóa tự tạo theo tên+đơn vị nếu chưa khớp sản phẩm nào (mã tự sinh `AUTO-XXXXXXXX`).
- Module `inventory` (`be/src/modules/inventory/`) — **báo cáo Nhập-Xuất-Tồn theo kỳ**, đã làm lại từ dạng đơn giản (tổng nhập/tổng bán/tồn hiện tại) sang chuẩn kế toán:
  - `GET /api/inventory?keyword=&status=in_stock|out_of_stock&periodFrom=&periodTo=&page=&pageSize=` — chỉ liệt kê sản phẩm **đã từng có hóa đơn mua vào**. Mỗi dòng có `openingQty/openingValue` (tồn đầu kỳ), `inQty/inValue` (nhập trong kỳ), `outQty/outValue` (xuất trong kỳ), `closingQty/closingValue` (tồn cuối kỳ) — định giá theo **giá vốn bình quân gia quyền** (tổng tiền nhập ÷ tổng SL nhập toàn thời gian); nếu không truyền `periodFrom/periodTo` thì mặc định = toàn thời gian (giống hành vi tồn kho "hiện tại").
  - `GET /api/inventory/export?...` — xuất **file Excel thật** (dùng `exceljs`, cài ở `be/`) đúng mẫu "BÁO CÁO NHẬP XUẤT TỒN" chuẩn kế toán VN mà anh gửi: có tiêu đề công ty (lấy từ `CompanyInfo`), tên báo cáo, kỳ báo cáo, header 2 hàng gộp ô (Tồn đầu kỳ/Nhập/Xuất/Tồn cuối × Số lượng/Thành tiền), có viền + tô màu + in đậm. Xuất **toàn bộ** dữ liệu khớp filter (không giới hạn theo trang).
  - **Đã thử tính năng "Âm Kho" (sản phẩm bán ra dù chưa từng nhập, số lượng âm) rồi bỏ theo yêu cầu** — logic tồn kho hiện tại vẫn giữ nguyên chỉ tính sản phẩm đã từng nhập. Việc dò/bổ sung cho sản phẩm bán âm kho được tách riêng sang module `reconciliation` bên dưới, không đụng vào nghiệp vụ tồn kho chính.
- Module `company` (`be/src/modules/company/`) — quản lý thông tin công ty (singleton):
  - `GET /api/company-info`, `PUT /api/company-info` (upsert — lần đầu tạo mới, các lần sau update, không sinh dòng trùng).
- Module `reconciliation` (`be/src/modules/reconciliation/`) — **"Tra soát hóa đơn"**, đối chiếu hóa đơn bán ra với tồn kho hiện tại để phát hiện hóa đơn xuất bán khi không đủ hàng (chỉ dùng để đối chiếu/sửa sai sót, **không** ảnh hưởng nghiệp vụ tồn kho gốc của module `inventory`):
  - `GET /api/reconciliation/invoices?status=completed|negative_stock&page=&pageSize=` — liệt kê **tất cả hóa đơn bán ra**; với mỗi hóa đơn, từng dòng hàng được so với `Inventory.quantity` **hiện tại** (dùng chung dữ liệu tồn kho thật, không tính lại riêng): đủ (`ok:true`) hay âm kho. Hóa đơn "Âm kho" nếu có ít nhất 1 dòng không đủ; "Hoàn thành" nếu tất cả dòng đủ **hoặc** đã được xử lý thủ công (xem bên dưới).
  - `GET /api/reconciliation/products-in-stock?keyword=` — danh sách sản phẩm còn hàng (`Inventory.quantity > 0`) để chọn làm "sản phẩm thay thế".
  - `PUT /api/reconciliation/invoices/:id/substitutions` (body `{ action: "draft"|"complete", entries: [{invoiceItemId, substituteProductId, quantity}] }`) — **nghiệp vụ "bổ sung/thay thế nguồn hàng thực xuất"**: với mỗi dòng hàng âm kho, người dùng chọn 1 (hoặc nhiều) sản phẩm **còn hàng** khác để ghi nhận là nguồn hàng thực tế đã xuất giao (sản phẩm gốc trên hóa đơn giữ nguyên, không bị sửa).
    - `action: "draft"` (Lưu tạm) — chỉ lưu lựa chọn, **chưa trừ tồn kho**, hóa đơn vẫn "Âm kho", có thể sửa lại sau.
    - `action: "complete"` (Hoàn thành) — validate: mỗi dòng âm kho phải được bổ sung **đủ số lượng đã bán**, sản phẩm thay thế phải **đủ tồn**; nếu qua hết thì **trừ thật** `Inventory` của (các) sản phẩm thay thế + ghi `StockTransaction` (note "Bổ sung thay thế cho hóa đơn ... (tra soát âm kho)") + set `Invoice.reconciliationResolvedAt` → hóa đơn khóa lại, chuyển hẳn sang "Hoàn thành", **không cho sửa lại nữa** (gọi lại API sẽ bị từ chối).
  - `GET /api/reconciliation/invoices/:id/export` — xuất Excel (dùng `exceljs`) chi tiết các sản phẩm thay thế đã bổ sung cho 1 hóa đơn: có thông tin công ty, số hóa đơn/ký hiệu/ngày lập/đối tác/tổng tiền/trạng thái, và bảng sản phẩm gốc ↔ sản phẩm thay thế ↔ số lượng ↔ trạng thái (Lưu tạm/Đã trừ kho).
- `shared/db/prisma.ts` dùng Prisma Client thật. Seed admin: `be/prisma/seed.ts` (`npm run prisma:seed`).
- Module `sample-module` cũ (từ bộ khung mẫu) không còn dùng, có thể xóa.
- **Giới hạn cần biết**: chưa chặn xuất kho vượt tồn **ngay tại thời điểm nạp hóa đơn** (tồn có thể âm nếu bán hàng chưa từng nhập/nhập chưa đủ) — hiện chỉ có công cụ **dò và sửa sau** qua "Tra soát hóa đơn", chưa có rule chặn cứng lúc `confirm`.

### 3. Frontend (`fe/`)
- Tailwind CSS v4 (`postcss.config.mjs`, `@import "tailwindcss"` trong `globals.css`).
- Layout: `src/app/(app)/layout.tsx` bọc `AuthGuard` + `AppShell` (sidebar tối màu có icon, topbar có tên user + đăng xuất); `src/app/login/` nằm ngoài group này nên không có sidebar.
- `shared/lib/fetcher.ts` **tự đính kèm** `Authorization: Bearer <token>` (đọc từ `shared/lib/auth-token.ts`) vào mọi request — không cần set header thủ công ở từng API call. Với các API trả **file** (Excel), dùng riêng `shared/lib/download-file.ts` (`downloadAuthenticatedFile`) vì cần đọc response dạng `blob` chứ không phải JSON.
- Menu (`shared/config/menu.ts` + `shared/layout/Sidebar.tsx`): Dashboard (placeholder) → Hóa đơn đầu vào → Hóa đơn đầu ra → **Tồn kho** → **Tra soát hóa đơn** → Báo cáo (còn placeholder).
- Topbar (`shared/layout/Topbar.tsx`): có icon nhỏ **"Thông tin công ty"** ngay bên trái nút Đăng xuất, dẫn tới `/settings/company`.
- Module `auth` (FE): `useAuth`, `AuthGuard`, `LoginForm` — login bằng username.
- Module `invoice` (FE) — đã xong luồng đầy đủ, dùng chung cho cả 2 trang `/invoices-in` và `/invoices-out`:
  - Chọn 1 hoặc nhiều file XML (`InvoiceFilePicker`) → gọi `/preview` → hiển thị **ngay trong trang** (không popup) qua `InvoicePreviewPanel`: nhóm theo nhà cung cấp (kể cả nhóm "Không MST" tô màu cam nếu thiếu MST), mỗi hóa đơn có nút mũi tên mở rộng/thu gọn xem chi tiết hàng hóa.
  - Bấm "Xác nhận nạp N hóa đơn" → gọi `/confirm` → mới lưu thật, tự refresh danh sách.
  - Bảng danh sách (`InvoiceTable`) có **phân trang 15 hàng/trang**, **checkbox chọn dòng + chọn tất cả**, nút xóa từng dòng (icon thùng rác, có `window.confirm`) và nút **"Xóa đã chọn (n)"** trên `PageHeader` khi có dòng được tick, nút **"Chi tiết"** mở rộng ngay trong bảng (không popup), có cache nên chỉ gọi API 1 lần/hóa đơn.
  - Thanh filter (`InvoiceDateFilter`): Từ ngày / Đến ngày / dropdown Công ty (đối tác) — dùng chung 1 nút "Lọc" + "Xóa lọc". Ô tìm sản phẩm trong hóa đơn (debounce 400ms) nằm riêng phía trên thanh filter.
  - Góc phải ngang hàng với thanh filter: chữ **"Tổng tiền: ..."** (to, `text-xl font-semibold`, màu xanh dương) — tính theo **toàn bộ** kết quả đang lọc, không chỉ trang hiện tại.
  - State quản lý bởi `hooks/useInvoiceImport.ts` (preview→confirm) và `hooks/useInvoiceList.ts` (danh sách + phân trang + mọi filter + `totalAmountSum`).
- Module `inventory` (FE, `src/modules/inventory/` + trang `/inventory`):
  - Bảng đơn giản: STT (đánh số liên tục qua các trang) · Mã hàng · **Tên hàng (rộng 450px, cắt "..." + tooltip khi dài)** · ĐVT · SL đã nhập · SL đã bán · Tồn kho · Trạng thái (badge Còn hàng/Hết hàng) — số lượng hiển thị **số nguyên, không thập phân**.
  - Filter: ô tìm theo mã/tên, tab Tất cả/Còn hàng/Hết hàng, **"Từ kỳ"/"Đến kỳ"** chọn theo tháng (`input type="month"`) — quy đổi sang ngày đầu/cuối tháng trước khi gọi API.
  - Phân trang **20 sản phẩm/trang**.
  - Nút **"Xuất Excel"** ở `PageHeader` — gọi thẳng `GET /api/inventory/export` (kèm token qua `downloadAuthenticatedFile`) để tải file thật khớp mẫu báo cáo, không dựng file ở FE.
- Module `company` (FE, `src/modules/company/` + trang `/settings/company`): form khai báo Tên công ty (bắt buộc)/MST/Địa chỉ/SĐT/Email, có báo "Đã lưu lúc ..." sau khi lưu.
- Module `reconciliation` (FE, `src/modules/reconciliation/` + trang `/reconciliation`):
  - Bảng hóa đơn bán ra + badge trạng thái (Hoàn thành xanh / Âm kho đỏ) + tab lọc Tất cả/Hoàn thành/Âm kho.
  - Nút **"Chi tiết"** mở rộng bảng con từng dòng hàng (`ReconciliationInvoiceDetail`): SL bán, tồn hiện tại, kết quả Khớp kho/Âm kho; dòng âm kho có nút **"Bổ sung"**.
  - "Bổ sung" mở **popup lớn** (`shared/ui/Modal.tsx` — component modal dùng chung mới) hiển thị `InStockProductPickerModal`: ô tìm theo tên/mã hàng, danh sách sản phẩm còn hàng **phân trang 5/trang**, mỗi dòng có ô nhập SL + nút "Thêm" riêng, **số tồn hiển thị to + in đậm**. Popup không tự đóng sau khi thêm để chọn được nhiều sản phẩm liên tiếp.
  - Dưới bảng chi tiết: nút **"Lưu tạm"** / **"Hoàn thành"** — gọi `PUT .../substitutions`; sau khi "Hoàn thành" thành công thì khóa toàn bộ UI chỉnh sửa của hóa đơn đó (server cũng chặn).
  - Nút **"Xuất Excel"** cạnh nút "Chi tiết" trên mỗi dòng hóa đơn — tải file chi tiết bổ sung của riêng hóa đơn đó.
- Component dùng chung: `PageHeader`, `Card`, `StatCard`, `EmptyState`, `Pagination`, `Modal` (mới), `icons.tsx` (đã thêm `TrashIcon`, `DownloadIcon`, `SearchCheckIcon`), `Button` (Tailwind, có thêm variant `danger`).
- **Lưu ý kỹ thuật**: token lưu ở `localStorage` (không phải cookie) → chặn trang chưa đăng nhập chỉ chạy ở client, nội dung có thể "chớp" nhẹ trước khi redirect. Chấp nhận được cho hệ thống nội bộ.
- Module `cart` — **"Giỏ hàng" để soạn phiếu xuất kho/báo giá nháp**, hoàn toàn tách biệt với nghiệp vụ tồn kho chính (không đụng DB `Inventory`/`StockTransaction`):
  - BE (`be/src/modules/cart/`): chỉ có 1 API `POST /api/cart/export-invoice` — nhận `{ customer: {name, taxCode?, address?}, items: [{productId, code, name, unit, quantity, unitPrice}] }`, **không lưu DB, không trừ kho**, chỉ dựng file Excel "PHIẾU XUẤT KHO" (`exceljs`, có header lấy từ `CompanyInfo` của mình + thông tin khách hàng từ form) rồi trả về.
  - FE: giỏ hàng lưu **client-side trong `localStorage`** (`modules/cart/lib/cart-storage.ts`, key `quanlykho.cart`), đồng bộ qua custom event `cart-updated` + `useCart()` hook — không có bảng DB nào cho giỏ hàng, mất khi xóa cache trình duyệt (chấp nhận được vì đây chỉ là công cụ soạn nháp).
  - Trang **Tồn kho** (`InventoryTable`): thêm nút tròn nhỏ "+" cạnh badge Trạng thái mỗi dòng → mở `AddToCartModal` nhập **số lượng + đơn giá** (đơn giá nhập tay vì `Product` không có field giá) → thêm vào giỏ. **Không chặn nhập vượt tồn kho hiện có** (theo yêu cầu).
  - Trang **Giỏ hàng** (`/cart`, menu mới giữa "Tồn kho" và "Tra soát hóa đơn", badge số lượng ở Sidebar): bảng sửa được số lượng/đơn giá trực tiếp, xóa từng dòng hoặc xóa cả giỏ, nút **"Xuất hóa đơn"** mở `ExportInvoiceModal` **chọn khách hàng có sẵn từ danh sách** (không gõ tay) → gọi API, tải file Excel, **rồi tự làm trống giỏ hàng**.
  - **Quy trình dự kiến**: thêm SP vào giỏ → xuất Excel gửi khách → khách nhận hàng thật → khi hóa đơn điện tử chính thức (XML) được **nạp lại vào hệ thống qua `/invoices-out`** thì lúc đó mới thật sự **trừ kho** (dùng đúng luồng `invoice` confirm sẵn có) — giỏ hàng/Excel ở đây chỉ mang tính tham khảo/soạn thảo, không phải nguồn sự thật cho tồn kho.
- Module `customer` — **khai báo khách hàng thủ công**, khác hẳn `Partner` (Partner tự sinh ngầm khi nạp XML hóa đơn; `Customer` do người dùng chủ động thêm để dùng lại nhiều lần):
  - DB: model `Customer` (`id, name, taxCode?, address?, phone?, createdAt`) — không có ràng buộc unique, cho phép trùng tên/MST tùy ý vì chỉ phục vụ chọn nhanh, không dùng để đối chiếu nghiệp vụ hóa đơn.
  - BE (`be/src/modules/customer/`): CRUD chuẩn theo đúng khuôn mẫu module `product` — `POST /api/customers/search` (keyword+phân trang), `POST /api/customers`, `PUT /api/customers/:id`, `DELETE /api/customers/:id`.
  - FE: trang **`/customers`** (menu "Khách hàng", icon `BuildingIcon`, nằm giữa "Giỏ hàng" và "Tra soát hóa đơn") — bảng danh sách + modal thêm/sửa (`CustomerFormModal`) + xóa (có `window.confirm`).
  - **Điểm tích hợp quan trọng**: `ExportInvoiceModal` (trong module `cart`) đã đổi từ 3 ô nhập tay (tên/MST/địa chỉ) sang **ô tìm kiếm dạng combobox** (gõ tên/MST → danh sách gợi ý lọc theo thời gian thực, bấm chọn 1 dòng) trên toàn bộ `searchCustomerApi({ page:1, pageSize:200 })` load 1 lần khi mở modal — nếu chưa có khách hàng nào thì hiện cảnh báo + link sang `/customers` để thêm trước, không cho nhập tay nữa.
- Module `dashboard` — nối Dashboard (`/`) với số liệu thật thay placeholder 0:
  - BE (`be/src/modules/dashboard/`): 1 API `GET /api/dashboard/summary` gộp — `totalProducts` (đếm `Product`), `invoicesInThisMonth`/`invoicesOutThisMonth` (đếm `Invoice` theo `type` + `issuedAt` trong tháng hiện tại theo giờ UTC), `inventoryValue` (tổng giá trị tồn kho **hiện tại**, tái dùng logic tính giá vốn bình quân của module `inventory` qua hàm mới `getInventoryTotalValueService()` xuất thêm từ `inventory.service.ts`), `recentActivities` (8 hóa đơn mới nhất theo `createdAt`, cả mua lẫn bán, kèm tên đối tác).
  - FE: trang chủ (`fe/src/app/(app)/page.tsx`) chuyển thành client component, gọi `useDashboardSummary()` — 4 `StatCard` hiện số thật, khối "Hoạt động gần đây" liệt kê hóa đơn mới nhất (icon nhập/xuất khác màu, tên đối tác, ngày, tổng tiền) thay vì `EmptyState` tĩnh.

### 4. Việc tiếp theo (đề xuất thứ tự)
1. **Rule chặn xuất kho vượt tồn ngay lúc nạp hóa đơn** (business rule quan trọng, vẫn chưa làm) — khi `type = "sale"`, cân nhắc kiểm tra `Inventory.quantity` đủ trước khi trừ trong `confirmInvoiceXmlBatchService`; hiện chỉ có "Tra soát hóa đơn" để dò/sửa **sau khi đã nạp**, chưa chặn từ đầu.
2. Trang quản lý **sản phẩm** (FE) — hiện chỉ có API `product`, chưa có UI; cần để đổi tên/mã các sản phẩm `AUTO-XXXXXXXX` được tự tạo từ hóa đơn.
3. Trang quản lý **đối tác** (`Partner` — nhà cung cấp/khách hàng tự sinh từ hóa đơn XML, khác với `Customer` khai báo tay ở trên) — hiện chỉ tạo ngầm khi nạp hóa đơn, chưa có route/API/UI riêng.
4. Trang **Báo cáo** (`/reports`) vẫn là placeholder — module `inventory` đã có báo cáo NXT theo kỳ + xuất Excel rồi, có thể biến `/reports` thành nơi tổng hợp thêm các báo cáo khác (doanh thu, top sản phẩm bán chạy...) nếu cần.
5. Cân nhắc chuyển JWT từ `localStorage` sang cookie + middleware Next.js nếu cần chặn truy cập chắc chắn từ server (hiện chỉ chặn ở client).
6. Có thể cân nhắc thêm nút xóa 1 dòng "bổ sung" đã lưu tạm ngay trong `ReconciliationInvoiceDetail` khi hóa đơn đã có sẵn nhiều lần lưu tạm (hiện đã có nhưng chưa test kỹ trên nhiều lần sửa qua lại) — nên kiểm tra lại UX khi user vào sửa 1 hóa đơn đã lưu tạm nhiều lần trước đó.
