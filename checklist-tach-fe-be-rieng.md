# CHECKLIST CHUẨN CHO DỰ ÁN TÁCH FE / BE RIÊNG
Áp dụng cho dự án dùng:
- **FE**: Next.js / React
- **BE**: Node.js / Express / Nest / Fastify
- Mục tiêu: dễ quản lý, dễ scale, dễ tái sử dụng module sau này

---

# 1. MỤC TIÊU KIẾN TRÚC
## Phải hiểu rõ ngay từ đầu
- FE và BE là **2 phần riêng biệt**
- FE chỉ lo:
  - giao diện
  - trải nghiệm người dùng
  - gọi API
  - state frontend
- BE chỉ lo:
  - API
  - business logic
  - database
  - validate
  - auth/permission
  - xử lý dữ liệu

## Không làm mơ hồ
- Không để FE tự xử lý business rule nặng
- Không để BE render UI
- Không để query database xuất hiện ở FE
- Không để API route bên BE chứa quá nhiều logic nếu chưa tách service

---

# 2. CẤU TRÚC TỔNG THỂ DỰ ÁN
```bash
project/
  fe/
  be/
  docs/
```

## Ý nghĩa
### `fe/`
Toàn bộ source frontend

### `be/`
Toàn bộ source backend

### `docs/`
Tài liệu dự án:
- flow nghiệp vụ
- api contract
- db notes
- rule tính toán
- checklist triển khai

---

# 3. CHECKLIST KHI TẠO DỰ ÁN MỚI
## Tổng thể
- [ ] Đã quyết định FE và BE tách riêng
- [ ] Đã tạo 2 thư mục `fe/` và `be/`
- [ ] Đã có file README cho từng phần
- [ ] Đã xác định FE gọi API qua base URL nào
- [ ] Đã xác định môi trường dev / staging / production
- [ ] Đã có file `.env.example` cho FE và BE

## Git
- [ ] Có `.gitignore`
- [ ] Có branch strategy tối thiểu: `main`, `dev`, `feature/...`
- [ ] Có quy ước commit message
- [ ] Không commit file build / env thật / file tạm

---

# 4. CẤU TRÚC CHUẨN CHO FRONTEND
```bash
fe/
  src/
    modules/
    shared/
    app/            # nếu dùng Next.js App Router
    pages/          # nếu dùng Pages Router hoặc React Router mapping
    styles/
  public/
  package.json
  README.md
  .env.example
```

## 4.1. `fe/src/modules/`
Nơi chứa từng tính năng frontend

Ví dụ:
```bash
fe/src/modules/
  auth/
  user/
  payroll/
  import-bank/
  reconcile/
```

### Checklist
- [ ] Mỗi tính năng có thư mục riêng
- [ ] Không nhét toàn bộ UI vào 1 file lớn
- [ ] Không để code của module này rải sang module khác

---

## 4.2. Cấu trúc 1 module FE
```bash
fe/src/modules/payroll/
  components/
  hooks/
  services/
  types/
  constants/
  README.md
  index.ts
```

### Giải thích
#### `components/`
Chứa UI của module:
- form
- table
- filter
- modal
- card

#### `hooks/`
Chứa custom hooks React:
- fetch data
- loading/error state
- state logic phức tạp
- hành vi dùng lại trong module

#### `services/`
Chứa code gọi API backend:
- `getPayroll`
- `createPayroll`
- `exportPayroll`

#### `types/`
Chứa TypeScript types của frontend module

#### `constants/`
Chứa hằng số frontend:
- page size
- option filter
- text trạng thái
- key tĩnh

#### `README.md`
Mô tả module FE làm gì, dùng API nào, component chính là gì

#### `index.ts`
Điểm export tập trung của module

### Checklist
- [ ] UI để trong `components/`
- [ ] Gọi API để trong `services/`
- [ ] State logic để trong `hooks/`
- [ ] Type để trong `types/`
- [ ] Không gọi `fetch` trực tiếp lung tung trong quá nhiều component
- [ ] Không nhét business logic nặng vào component

---

## 4.3. `fe/src/shared/`
Nơi chứa phần dùng chung toàn frontend

```bash
fe/src/shared/
  ui/
  lib/
  config/
```

### `ui/`
Component tái sử dụng:
- Button
- Input
- Modal
- DataTable
- Select

### `lib/`
Hàm dùng chung:
- fetcher
- formatMoney
- formatDate
- classnames helper

### `config/`
Cấu hình dùng chung FE:
- API base URL
- route constants
- app config nhẹ

### Checklist
- [ ] Chỉ đưa vào `shared/` những gì thực sự dùng chung
- [ ] Không biến `shared/` thành “sọt rác”
- [ ] Cái gì đặc thù module thì giữ trong module

---

# 5. CẤU TRÚC CHUẨN CHO BACKEND
```bash
be/
  src/
    modules/
    shared/
    app.ts
    server.ts
  prisma/          # nếu dùng Prisma
  package.json
  README.md
  .env.example
```

## 5.1. `be/src/modules/`
Nơi chứa từng tính năng backend

Ví dụ:
```bash
be/src/modules/
  auth/
  user/
  payroll/
  import-bank/
  reconcile/
```

### Checklist
- [ ] Mỗi tính năng backend có thư mục riêng
- [ ] Không để routes/services/repositories của nhiều tính năng trộn vào nhau
- [ ] Có thể copy module sang dự án khác

---

## 5.2. Cấu trúc 1 module BE
```bash
be/src/modules/payroll/
  routes/
  services/
  repositories/
  mappers/
  schemas/
  types/
  constants/
  README.md
  index.ts
```

### Giải thích
#### `routes/`
Khai báo API endpoints:
- nhận request
- gọi service
- trả response

#### `services/`
Nơi điều phối nghiệp vụ:
- validate input
- gọi repository
- gọi lib xử lý
- trả output

#### `repositories/`
Chứa query database:
- findMany
- findUnique
- create
- update
- delete
- aggregate

#### `mappers/`
Chuyển đổi raw DB data thành output/API response sạch hơn

#### `schemas/`
Validate dữ liệu request/body/query/params bằng Zod/Yup/Joi

#### `types/`
TypeScript types/interfaces backend

#### `constants/`
Hằng số backend:
- status
- enum
- batch size
- key nội bộ
- rule cố định

#### `README.md`
Mô tả module backend:
- API nào
- DB nào
- chỗ cần sửa khi tái sử dụng

#### `index.ts`
Điểm export tập trung

### Checklist
- [ ] Route mỏng
- [ ] Business logic nằm trong `services/`
- [ ] Query DB nằm trong `repositories/`
- [ ] Có schema validate input
- [ ] Có type rõ ràng
- [ ] Không query DB trực tiếp trong route nếu có thể tách ra repository
- [ ] Không nhét toàn bộ xử lý vào 1 file route

---

## 5.3. `be/src/shared/`
Nơi chứa phần dùng chung backend

```bash
be/src/shared/
  db/
  lib/
  middleware/
  utils/
```

### `db/`
Kết nối DB, prisma client, transaction helper

### `lib/`
Helper chung backend:
- logger
- response helper
- parse helper
- date helper

### `middleware/`
Middleware toàn backend:
- auth middleware
- error middleware
- request logging
- role check

### `utils/`
Các utility backend thật sự dùng chung

### Checklist
- [ ] Chỉ đưa vào shared những thứ dùng chung nhiều module
- [ ] Không đẩy business logic đặc thù vào shared
- [ ] Prisma client phải nằm 1 chỗ thống nhất

---

# 6. NGUYÊN TẮC PHÂN CHIA FE / BE
## Frontend chịu trách nhiệm
- render UI
- giữ state giao diện
- gọi API
- validate giao diện mức nhẹ
- format hiển thị

## Backend chịu trách nhiệm
- validate chính thức
- auth / permission
- business logic
- DB
- file import/export xử lý nặng
- tính toán nghiệp vụ quan trọng

### Checklist
- [ ] Rule nghiệp vụ quan trọng nằm ở BE
- [ ] FE không tự “quyết định” dữ liệu cốt lõi
- [ ] FE chỉ hiển thị theo data BE trả về
- [ ] Những tính toán ảnh hưởng DB / tiền / quyền truy cập đều phải ở BE

---

# 7. CHUẨN KẾT NỐI FE -> BE
## Bắt buộc thống nhất
- base API URL
- format response
- format error
- auth token
- cách gửi query/body/file

## Ví dụ response chuẩn
```json
{
  "ok": true,
  "data": {}
}
```

hoặc lỗi:
```json
{
  "ok": false,
  "message": "Nội dung lỗi"
}
```

### Checklist
- [ ] FE và BE thống nhất format response
- [ ] FE có helper gọi API chung
- [ ] BE có helper trả response chung
- [ ] Có xử lý lỗi 401/403/500 rõ ràng
- [ ] Không để mỗi route trả 1 kiểu JSON khác nhau

---

# 8. CHUẨN ENV
## FE `.env.example`
- [ ] `NEXT_PUBLIC_API_BASE_URL=...`
- [ ] các biến public khác nếu cần

## BE `.env.example`
- [ ] `PORT=...`
- [ ] `DATABASE_URL=...`
- [ ] `JWT_SECRET=...`
- [ ] `CORS_ORIGIN=...`

### Checklist
- [ ] FE không dùng secret backend
- [ ] Biến public FE phải có prefix đúng chuẩn framework
- [ ] Có file `.env.example` nhưng không commit `.env` thật

---

# 9. CHUẨN AUTH
## FE
- lưu token ở đâu phải thống nhất
- có cơ chế redirect nếu chưa đăng nhập
- có helper gọi API kèm auth

## BE
- verify token
- middleware auth
- permission check
- không tin dữ liệu gửi từ FE

### Checklist
- [ ] Auth check chính thức phải ở BE
- [ ] FE chỉ hỗ trợ trải nghiệm, không phải nơi quyết định quyền thật
- [ ] Role/permission không hard-code lung tung ở nhiều route

---

# 10. CHUẨN DATABASE
## Backend phải có
- schema rõ ràng
- migration rõ ràng
- repository tách riêng
- transaction hợp lý

### Checklist
- [ ] Không query DB trong FE
- [ ] Không để SQL/Prisma rải khắp service nếu có thể tách repository
- [ ] Có naming thống nhất cho table/model
- [ ] Có unique/index chỗ cần thiết
- [ ] Có xử lý import batch nếu dữ liệu lớn

---

# 11. CHUẨN API CONTRACT
Mỗi tính năng nên có ghi rõ:
- endpoint
- method
- input
- output
- lỗi có thể gặp

Ví dụ:
```md
POST /api/payroll/calculate
Input:
{
  "month": 2,
  "year": 2026
}

Output:
{
  "ok": true,
  "data": {
    "rows": []
  }
}
```

### Checklist
- [ ] Mỗi module có mô tả API chính
- [ ] FE dev và BE dev nhìn vào là hiểu ngay contract
- [ ] Khi đổi contract phải update docs/module README

---

# 12. CHUẨN MODULE TÁI SỬ DỤNG
Nếu muốn sau này copy module sang dự án khác, cả FE và BE đều phải tự chứa tương đối.

## FE module nên tự chứa
- components
- hooks
- services
- types
- constants
- README

## BE module nên tự chứa
- routes
- services
- repositories
- mappers
- schemas
- types
- constants
- README

### Checklist
- [ ] Module FE và BE cùng tên theo tính năng
- [ ] Có thể copy cả 2 phần sang dự án khác
- [ ] Ít phụ thuộc linh tinh vào module khác
- [ ] Cái gì dùng chung thật sự mới để vào `shared`

---

# 13. NGUYÊN TẮC ĐẶT TÊN
## FE
- Component: `PayrollForm.tsx`
- Hook: `usePayroll.ts`
- Service API: `payroll.api.ts`
- Type: `payroll.types.ts`
- Constant: `payroll.constants.ts`

## BE
- Route: `payroll.routes.ts`
- Service: `payroll.service.ts`
- Repository: `payroll.repository.ts`
- Mapper: `payroll.mapper.ts`
- Schema: `payroll.schema.ts`
- Type: `payroll.types.ts`
- Constant: `payroll.constants.ts`

### Checklist
- [ ] Tên file nhìn vào biết ngay chức năng
- [ ] Không đặt tên mơ hồ như `helper.ts`, `common.ts` nếu nội dung đặc thù
- [ ] Không tạo quá nhiều file “misc”, “temp”, “test2”

---

# 14. CHECKLIST CHO 1 TÍNH NĂNG MỚI
Ví dụ tính năng `payroll`

## FE
- [ ] Tạo `fe/src/modules/payroll/`
- [ ] Có `components/`
- [ ] Có `hooks/`
- [ ] Có `services/`
- [ ] Có `types/`
- [ ] Có `README.md`

## BE
- [ ] Tạo `be/src/modules/payroll/`
- [ ] Có `routes/`
- [ ] Có `services/`
- [ ] Có `repositories/`
- [ ] Có `schemas/`
- [ ] Có `types/`
- [ ] Có `README.md`

## Kết nối
- [ ] FE service gọi đúng endpoint BE
- [ ] FE type bám đúng output BE
- [ ] API contract đã được ghi rõ
- [ ] Test chạy qua cả FE và BE

---

# 15. CÁC LỖI PHỔ BIẾN CẦN TRÁNH
- [ ] FE tự tính business logic quan trọng rồi gửi lên BE
- [ ] Route BE vừa validate, vừa query, vừa tính toán, vừa format trong 1 file khổng lồ
- [ ] FE gọi API trực tiếp trong quá nhiều component lặp đi lặp lại
- [ ] `shared/` bị biến thành chỗ nhét code linh tinh
- [ ] 1 module phụ thuộc quá nhiều module khác
- [ ] Không có docs / README / contract
- [ ] FE và BE đặt tên endpoint, field không khớp nhau
- [ ] Không có `.env.example`
- [ ] Không có chiến lược xử lý lỗi thống nhất

---

# 16. CẤU TRÚC MẪU NÊN DÙNG
```bash
project/
  fe/
    src/
      app/
      modules/
        auth/
          components/
          hooks/
          services/
          types/
          constants/
          README.md
          index.ts
        payroll/
          components/
          hooks/
          services/
          types/
          constants/
          README.md
          index.ts
      shared/
        ui/
        lib/
        config/
    public/
    package.json
    README.md
    .env.example

  be/
    src/
      modules/
        auth/
          routes/
          services/
          repositories/
          schemas/
          types/
          constants/
          README.md
          index.ts
        payroll/
          routes/
          services/
          repositories/
          mappers/
          schemas/
          types/
          constants/
          README.md
          index.ts
      shared/
        db/
        lib/
        middleware/
        utils/
      app.ts
      server.ts
    prisma/
    package.json
    README.md
    .env.example

  docs/
    api-contract.md
    db-notes.md
    business-rules.md
```

---

# 17. CÂU HỎI TỰ CHECK TRƯỚC KHI BẮT ĐẦU
- FE và BE đã tách trách nhiệm rõ chưa?
- Nếu đổi UI, BE có ít bị ảnh hưởng không?
- Nếu đổi DB schema nhẹ, FE có không cần sửa nhiều không?
- Nếu copy tính năng sang dự án khác, có tìm được toàn bộ code theo module không?
- Nếu người mới vào dự án, họ có tìm đúng chỗ để sửa trong 5 phút không?

Nếu trả lời được **Có**, kiến trúc đang đi đúng hướng.

---

# 18. KẾT LUẬN NGẮN GỌN
Muốn làm dự án chuẩn kiểu **FE / BE tách riêng**, anh nên nhớ công thức này:

**FE lo giao diện + gọi API**  
**BE lo nghiệp vụ + database + auth**  
**Mỗi bên đều chia theo module**  
**Shared phải nhỏ và sạch**  
**Mọi thứ quan trọng phải có checklist, README, contract rõ ràng**

Khi bắt đầu dự án mới, hãy mở file checklist này ra và đi từng mục.
