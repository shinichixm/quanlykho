export type CompanyInfo = {
  id: number;
  name: string;
  taxCode: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  updatedAt: string;
};

export type CompanyInfoInput = {
  name: string;
  taxCode: string;
  address: string;
  phone: string;
  email: string;
};
