import { Router } from "express";
import { fail, ok } from "../../../shared/lib/api-response";
import { getCompanyInfoService, saveCompanyInfoService } from "../services/company.service";

export const companyRouter = Router();

companyRouter.get("/", async (_req, res) => {
  try {
    const result = await getCompanyInfoService();
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

companyRouter.put("/", async (req, res) => {
  try {
    const result = await saveCompanyInfoService(req.body || {});
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});
