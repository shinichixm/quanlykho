export type ReconciliationStatus = "completed" | "negative_stock";

export type SubstitutionEntry = {
  id: number;
  substituteProductId: number;
  substituteProductCode: string;
  substituteProductName: string;
  quantity: string;
  status: "draft" | "completed";
};

export type ReconciliationItem = {
  invoiceItemId: number;
  productCode: string;
  productName: string;
  unit: string;
  quantitySold: string;
  currentStock: string;
  ok: boolean;
  substitutions: SubstitutionEntry[];
};

export type ReconciliationInvoiceRow = {
  id: number;
  invoiceNo: string;
  invoiceSeries: string | null;
  issuedAt: string;
  partnerName: string;
  totalAmount: string;
  status: ReconciliationStatus;
  items: ReconciliationItem[];
};

export type InStockProduct = {
  id: number;
  code: string;
  name: string;
  unit: string;
  stockQty: string;
};
