export type SampleModuleInput = {
  keyword?: string;
  page?: number;
  pageSize?: number;
};

export type SampleModuleRow = {
  id: number;
  name: string;
  status: "active" | "inactive";
  createdAt?: string;
};

export type SampleModuleResult = {
  rows: SampleModuleRow[];
  total: number;
};
