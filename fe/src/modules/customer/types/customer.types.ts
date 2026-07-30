export type CustomerRow = {
  id: number;
  name: string;
  taxCode: string | null;
  address: string | null;
  phone: string | null;
  createdAt: string;
};

export type CustomerInput = {
  name: string;
  taxCode?: string;
  address?: string;
  phone?: string;
};
