import { Router } from "express";
import { fail } from "../../../shared/lib/api-response";
import { exportCartInvoiceExcelService } from "../services/cart.service";

export const cartRouter = Router();

cartRouter.post("/export-invoice", async (req, res) => {
  try {
    const buffer = await exportCartInvoiceExcelService(req.body);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="phieu-xuat-kho.xlsx"`);
    return res.send(buffer);
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});
