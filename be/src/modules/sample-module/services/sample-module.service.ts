import { sampleModuleInputSchema } from "../schemas/sample-module.schema";
import { findSampleModuleList } from "../repositories/sample-module.repository";
import { mapSampleModuleList } from "../mappers/sample-module.mapper";
import type { SampleModuleInput, SampleModuleResult } from "../types/sample-module.types";

export async function searchSampleModule(
  input: SampleModuleInput
): Promise<SampleModuleResult> {
  const parsed = sampleModuleInputSchema.parse(input);
  const skip = (parsed.page - 1) * parsed.pageSize;

  const rows = await findSampleModuleList({
    keyword: parsed.keyword || "",
    skip,
    take: parsed.pageSize,
  });

  return {
    rows: mapSampleModuleList(rows),
    total: rows.length,
  };
}
