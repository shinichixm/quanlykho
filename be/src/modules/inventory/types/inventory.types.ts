export type InventoryStatus = "in_stock" | "out_of_stock";

export type InventoryRow = {
  productId: number;
  code: string;
  name: string;
  unit: string;
  avgCost: string;
  openingQty: string;
  openingValue: string;
  inQty: string;
  inValue: string;
  outQty: string;
  outValue: string;
  closingQty: string;
  closingValue: string;
  status: InventoryStatus;
};

export type InventoryListResult = {
  rows: InventoryRow[];
  total: number;
  // Tổng giá trị tồn kho (closingValue) của TOÀN BỘ sản phẩm khớp bộ lọc hiện tại
  // (không chỉ trang đang xem).
  totalValue: string;
};
