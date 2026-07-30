import { Router } from "express";
import { fail, ok } from "../../../shared/lib/api-response";
import {
  createCustomerService,
  deleteCustomerService,
  searchCustomer,
  updateCustomerService,
} from "../services/customer.service";

export const customerRouter = Router();

customerRouter.post("/search", async (req, res) => {
  try {
    const result = await searchCustomer(req.body || {});
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

customerRouter.post("/", async (req, res) => {
  try {
    const result = await createCustomerService(req.body || {});
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

customerRouter.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await updateCustomerService(id, req.body || {});
    return res.json(ok(result));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});

customerRouter.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await deleteCustomerService(id);
    return res.json(ok(null));
  } catch (error) {
    return res
      .status(400)
      .json(fail(error instanceof Error ? error.message : "Unknown error"));
  }
});
