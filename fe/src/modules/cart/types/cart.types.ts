export type CartItem = {
  productId: number;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  // Giá nhập bình quân tại thời điểm thêm vào giỏ (chụp nhanh, không tự cập nhật
  // theo tồn kho về sau). Các giỏ hàng cũ trước khi có cột này sẽ thiếu field này.
  avgCost?: number;
};

export type CartCustomer = {
  name: string;
  taxCode: string;
  address: string;
};
