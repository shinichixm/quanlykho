import { Router } from "express";
import { fail, ok } from "../../../shared/lib/api-response";
import { getDashboardSummaryService } from "../services/dashboard.service";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", async (_req, res) => {
  try {
    const result = await getDashboardSummaryService();
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});
