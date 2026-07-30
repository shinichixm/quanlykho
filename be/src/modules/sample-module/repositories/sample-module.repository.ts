type FindSampleModuleListParams = {
  keyword?: string;
  skip?: number;
  take?: number;
};

type SampleModuleRawRow = {
  id: number;
  name: string;
  status: string;
  createdAt: string;
};

export async function findSampleModuleList(
  params: FindSampleModuleListParams
): Promise<SampleModuleRawRow[]> {
  void params;

  // TODO: thay bằng query DB thật
  return [
    { id: 1, name: "Bản ghi mẫu", status: "active", createdAt: new Date().toISOString() },
    { id: 2, name: "Bản ghi demo", status: "inactive", createdAt: new Date().toISOString() },
  ];
}
