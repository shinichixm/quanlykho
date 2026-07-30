export type ProductInput = {
  code: string;
  name: string;
  unit: string;
};

export type ProductUpdateInput = Partial<ProductInput>;

export type ProductSearchInput = {
  keyword?: string;
  page: number;
  pageSize: number;
};

export type ProductResult = {
  rows: ProductRow[];
  total: number;
};

export type ProductRow = {
  id: number;
  code: string;
  name: string;
  unit: string;
  createdAt: Date;
};
