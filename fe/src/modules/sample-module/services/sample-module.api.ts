import type { SampleModuleInput, SampleModuleResponse } from "../types/sample-module.types";
import { fetcher } from "@/shared/lib/fetcher";
import { API_BASE_URL } from "@/shared/config/api";

export async function searchSampleModule(
  input: SampleModuleInput
): Promise<SampleModuleResponse> {
  return fetcher<SampleModuleResponse>(`${API_BASE_URL}/api/sample-module/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
