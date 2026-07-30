export type InvoiceType = "purchase" | "sale";

export type InvoiceListItem = {
  id: number;
  type: InvoiceType;
  invoiceNo: string;
  invoiceSeries: string | null;
  issuedAt: string;
  partnerName: string;
  totalAmount: string;
  status: string;
  createdAt: string;
};

export type InvoicePartnerOption = {
  id: number;
  name: string;
};

export type PreviewInvoiceItemRow = {
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type PreviewInvoiceRow = {
  fileName: string;
  invoiceNo: string | null;
  invoiceSeries: string | null;
  issuedAt: string | null;
  partnerTaxCode: string | null;
  partnerName: string | null;
  totalAmount: number | null;
  items: PreviewInvoiceItemRow[];
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
  invoiceNo: string;
  invoiceSeries: string | null;
  issuedAt: string;
  status: string;
  totalAmount: string;
  partner: {
    name: string;
    taxCode: string;
    address: string | null;
  };
  items: InvoiceDetailItem[];
};
