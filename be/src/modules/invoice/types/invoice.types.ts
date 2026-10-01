export type InvoiceType = "purchase" | "sale";
// "goods" = hàng hóa (mặc định, tạo Product/tồn kho) | "cost" = chi phí (chỉ hóa đơn
// mua vào, lưu riêng, không đụng Product/tồn kho).
export type InvoiceCategory = "goods" | "cost";

export type ParsedInvoiceItem = {
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type ParsedInvoice = {
  invoiceNo: string;
  invoiceSeries: string | null;
  issuedAt: Date;
  partnerTaxCode: string;
  partnerTaxCodeMissing: boolean;
  partnerName: string;
  partnerAddress: string | null;
  totalAmount: number;
  items: ParsedInvoiceItem[];
};

export type ImportInvoiceResult = {
  invoiceId: number;
  invoiceNo: string;
  itemCount: number;
  createdProductCount: number;
};

export type InvoiceListItem = {
  id: number;
  type: InvoiceType;
  category: InvoiceCategory;
  invoiceNo: string;
  invoiceSeries: string | null;
  issuedAt: Date;
  partnerName: string;
  totalAmount: string;
  status: string;
  createdAt: Date;
};

export type PreviewInvoiceRow = {
  fileName: string;
  invoiceNo: string | null;
  invoiceSeries: string | null;
  issuedAt: string | null;
  partnerTaxCode: string | null;
  partnerName: string | null;
  totalAmount: number | null;
  items: ParsedInvoiceItem[];
  error: string | null;
};

export type ConfirmInvoiceRow = {
  fileName: string;
  success: boolean;
  invoiceNo: string | null;
  itemCount: number;
  createdProductCount: number;
  error: string | null;
};

export type InvoiceDetailItem = {
  id: number;
  productName: string;
  productCode: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  amount: string;
};

export type InvoiceDetail = {
  id: number;
  type: InvoiceType;
  category: InvoiceCategory;
  invoiceNo: string;
  invoiceSeries: string | null;
  issuedAt: Date;
  status: string;
  totalAmount: string;
  partner: {
    name: string;
    taxCode: string;
    address: string | null;
  };
  items: InvoiceDetailItem[];
};
