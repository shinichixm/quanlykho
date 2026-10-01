import { Router } from "express";
import multer from "multer";
import { fail, ok } from "../../../shared/lib/api-response";
import {
  confirmInvoiceXmlBatchService,
  deleteInvoiceService,
  deleteInvoicesBulkService,
  getInvoiceDetailService,
  listInvoicePartnersService,
  listInvoiceService,
  previewInvoiceXmlBatchService,
} from "../services/invoice.service";
import {
  invoiceBulkDeleteBodySchema,
  invoiceCategorySchema,
  invoiceTypeSchema,
} from "../schemas/invoice.schema";
import type { InvoiceCategory } from "../types/invoice.types";
import { INVOICE_MAX_FILE_SIZE_BYTES } from "../constants/invoice.constants";

export const invoiceRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: INVOICE_MAX_FILE_SIZE_BYTES },
});

function toUploadedFiles(files: Express.Multer.File[] | undefined) {
  return (files || []).map((file) => ({
    fileName: file.originalname,
    buffer: file.buffer,
  }));
}

// FE gửi kèm field text "categories" (JSON: { "<fileName>": "goods" | "cost" }) trong
// cùng multipart form với "files" — phân loại do người dùng chọn lúc xem trước.
function parseCategoriesField(raw: unknown): Record<string, InvoiceCategory> {
  if (typeof raw !== "string" || !raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};

    const result: Record<string, InvoiceCategory> = {};
    for (const [fileName, value] of Object.entries(parsed)) {
      const check = invoiceCategorySchema.safeParse(value);
      if (check.success) result[fileName] = check.data;
    }
    return result;
  } catch {
    return {};
  }
}

invoiceRouter.post("/preview", upload.array("files"), async (req, res) => {
  try {
    const type = invoiceTypeSchema.parse(req.body?.type);
    const files = toUploadedFiles(req.files as Express.Multer.File[]);

    if (files.length === 0) {
      return res.status(400).json(fail("Vui lòng chọn ít nhất 1 file XML"));
    }

    const result = await previewInvoiceXmlBatchService(files, type);
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

invoiceRouter.post("/confirm", upload.array("files"), async (req, res) => {
  try {
    const type = invoiceTypeSchema.parse(req.body?.type);
    const files = toUploadedFiles(req.files as Express.Multer.File[]);

    if (files.length === 0) {
      return res.status(400).json(fail("Vui lòng chọn ít nhất 1 file XML"));
    }

    const categoriesByFileName = parseCategoriesField(req.body?.categories);

    const result = await confirmInvoiceXmlBatchService(files, type, categoriesByFileName);
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

invoiceRouter.get("/", async (req, res) => {
  try {
    const type = invoiceTypeSchema.parse(req.query.type);
    const category = req.query.category
      ? invoiceCategorySchema.parse(req.query.category)
      : undefined;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;
    const dateFrom = typeof req.query.dateFrom === "string" ? req.query.dateFrom : undefined;
    const dateTo = typeof req.query.dateTo === "string" ? req.query.dateTo : undefined;
    const partnerId = req.query.partnerId ? Number(req.query.partnerId) : undefined;
    const productKeyword =
      typeof req.query.productKeyword === "string" ? req.query.productKeyword : undefined;

    const result = await listInvoiceService({
      type,
      category,
      page,
      pageSize,
      dateFrom,
      dateTo,
      partnerId,
      productKeyword,
    });
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

invoiceRouter.get("/partners", async (req, res) => {
  try {
    const type = invoiceTypeSchema.parse(req.query.type);
    const result = await listInvoicePartnersService(type);
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

invoiceRouter.delete("/bulk", async (req, res) => {
  try {
    const { ids } = invoiceBulkDeleteBodySchema.parse(req.body);
    const result = await deleteInvoicesBulkService(ids);
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

invoiceRouter.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await getInvoiceDetailService(id);
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(404)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

invoiceRouter.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await deleteInvoiceService(id);
    return res.json(ok({ id }));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});
