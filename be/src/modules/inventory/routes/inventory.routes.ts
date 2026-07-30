import { Router } from "express";
import { fail, ok } from "../../../shared/lib/api-response";
import { inventoryStatusSchema } from "../schemas/inventory.schema";
import { exportInventoryReportExcelService, listInventoryService } from "../services/inventory.service";

export const inventoryRouter = Router();

function parseListQuery(req: import("express").Request) {
  const keyword = typeof req.query.keyword === "string" ? req.query.keyword : undefined;
  const status = req.query.status ? inventoryStatusSchema.parse(req.query.status) : undefined;
  const periodFrom = typeof req.query.periodFrom === "string" ? req.query.periodFrom : undefined;
  const periodTo = typeof req.query.periodTo === "string" ? req.query.periodTo : undefined;

  return { keyword, status, periodFrom, periodTo };
}

inventoryRouter.get("/", async (req, res) => {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;

    const result = await listInventoryService({ ...parseListQuery(req), page, pageSize });
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

inventoryRouter.get("/export", async (req, res) => {
  try {
    const buffer = await exportInventoryReportExcelService(parseListQuery(req));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="bao-cao-nhap-xuat-ton.xlsx"`);
    return res.send(buffer);
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});
