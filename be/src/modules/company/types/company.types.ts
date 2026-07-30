export type CompanyInfoInput = {
  name: string;
  taxCode?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type CompanyInfoResult = {
  id: number;
  name: string;
  taxCode: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  updatedAt: Date;
} | null;
