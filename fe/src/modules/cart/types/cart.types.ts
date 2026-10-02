export type CartItem = {
  productId: number;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
};

export type CartCustomer = {
  name: string;
  taxCode: string;
  address: string;
};
