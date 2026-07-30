import { Router } from "express";
import { fail, ok } from "../../../shared/lib/api-response";
import {
  createProductService,
  deleteProductService,
  searchProduct,
  updateProductService,
} from "../services/product.service";

export const productRouter = Router();

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
