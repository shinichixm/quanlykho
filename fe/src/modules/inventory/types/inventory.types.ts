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
