export type CustomerInput = {
  name: string;
  taxCode?: string | null;
  address?: string | null;
  phone?: string | null;
};

export type CustomerUpdateInput = Partial<CustomerInput>;

export type CustomerSearchInput = {
  keyword?: string;
  page: number;
  pageSize: number;
};

export type CustomerRow = {
  id: number;
  name: string;
  taxCode: string | null;
  address: string | null;
  phone: string | null;
  createdAt: Date;
};

export type CustomerResult = {
  rows: CustomerRow[];
  total: number;
};
