import { Router } from "express";
import multer from "multer";
import { fail, ok } from "../../../shared/lib/api-response";
import {
  createProductService,
  deleteProductService,
  importProductsFromExcelService,
  previewProductImportExcelService,
  searchProduct,
  updateProductService,
} from "../services/product.service";
import { buildProductImportTemplateExcel } from "../lib/product-import-excel";
import { PRODUCT_IMPORT_MAX_FILE_SIZE_BYTES } from "../constants/product.constants";

export const productRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PRODUCT_IMPORT_MAX_FILE_SIZE_BYTES },
});

productRouter.post("/search", async (req, res) => {
  try {
    const result = await searchProduct(req.body || {});
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

productRouter.post("/", async (req, res) => {
  try {
    const result = await createProductService(req.body || {});
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

productRouter.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await updateProductService(id, req.body || {});
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

productRouter.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await deleteProductService(id);
    return res.json(ok(null));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

productRouter.get("/import/template", async (_req, res) => {
  try {
    const buffer = await buildProductImportTemplateExcel();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="mau-nhap-san-pham.xlsx"`);
    return res.send(buffer);
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

productRouter.post("/import/preview", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(fail("Vui lòng chọn file Excel"));
    }
    const result = await previewProductImportExcelService(req.file.buffer);
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Không đọc được file Excel"));
  }
});

productRouter.post("/import/confirm", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(fail("Vui lòng chọn file Excel"));
    }
    const result = await importProductsFromExcelService(req.file.buffer);
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Nhập sản phẩm thất bại"));
  }
});
