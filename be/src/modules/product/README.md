# Module product

Quản lý danh mục hàng hóa.

## API
- `POST /api/product/search` — tìm kiếm/phân trang: `{ keyword?, page, pageSize }`
- `POST /api/product` — tạo mới: `{ code, name, unit }`
- `PUT /api/product/:id` — cập nhật: `{ code?, name?, unit? }`
- `DELETE /api/product/:id` — xóa

## DB
Model `Product` (`be/prisma/schema.prisma`). `code` unique.

## Ghi chú
- `product` là nền cho `invoice-import` và `stock` (liên kết qua `productId`).
