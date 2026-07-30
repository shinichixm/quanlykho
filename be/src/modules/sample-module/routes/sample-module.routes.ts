import { Router } from "express";
import { searchSampleModule } from "../services/sample-module.service";
import { ok, fail } from "../../../shared/lib/api-response";

export const sampleModuleRouter = Router();

sampleModuleRouter.post("/search", async (req, res) => {
  try {
    const result = await searchSampleModule(req.body || {});
    return res.json(ok(result));
  } catch (error) {
    return res.status(400).json(
      fail(error instanceof Error ? error.message : "Unknown error")
    );
  }
});
