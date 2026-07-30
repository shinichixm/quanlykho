# Module partner

Nhà cung cấp / khách hàng — lấy từ thông tin người bán/người mua trên hóa đơn điện tử.

## Hiện trạng
Chưa có API riêng (chưa có màn hình quản lý đối tác). Hiện chỉ dùng nội bộ bởi module `invoice` để tự tạo/tìm đối tác theo mã số thuế (`taxCode`) khi nạp hóa đơn XML.

## DB
Model `Partner` (`be/prisma/schema.prisma`). `taxCode` unique.
