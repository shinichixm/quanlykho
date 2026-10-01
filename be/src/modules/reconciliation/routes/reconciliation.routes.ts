import { Router } from "express";
import { fail, ok } from "../../../shared/lib/api-response";
import { reconciliationStatusSchema } from "../schemas/reconciliation.schema";
import {
  exportReconciliationInvoiceExcelService,
  listInStockProductsForReconciliationService,
  listReconciliationInvoicesService,
  saveInvoiceSubstitutionsService,
} from "../services/reconciliation.service";

export const reconciliationRouter = Router();

reconciliationRouter.get("/invoices", async (req, res) => {
  try {
    const status = req.query.status
      ? reconciliationStatusSchema.parse(req.query.status)
      : undefined;
    const partnerId = req.query.partnerId ? Number(req.query.partnerId) : undefined;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;

    const result = await listReconciliationInvoicesService({ status, partnerId, page, pageSize });
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

reconciliationRouter.get("/products-in-stock", async (req, res) => {
  try {
    const keyword = typeof req.query.keyword === "string" ? req.query.keyword : undefined;
    const result = await listInStockProductsForReconciliationService(keyword);
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

reconciliationRouter.get("/invoices/:id/export", async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);
    const buffer = await exportReconciliationInvoiceExcelService(invoiceId);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="chi-tiet-bo-sung-hoa-don-${req.params.id}.xlsx"`
    );
    return res.send(buffer);
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

reconciliationRouter.put("/invoices/:id/substitutions", async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);
    const result = await saveInvoiceSubstitutionsService(invoiceId, req.body || {});
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});
