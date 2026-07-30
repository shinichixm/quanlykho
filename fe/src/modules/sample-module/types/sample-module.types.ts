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

export type SampleModuleData = {
  rows: SampleModuleRow[];
  total: number;
};

export type SampleModuleResponse = {
  ok: boolean;
  data: SampleModuleData;
};
