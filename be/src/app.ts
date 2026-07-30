import express from "express";
import cors from "cors";
import { productRouter } from "./modules/product";
import { authRouter } from "./modules/auth";
import { invoiceRouter } from "./modules/invoice";
import { inventoryRouter } from "./modules/inventory";
import { companyRouter } from "./modules/company";
import { reconciliationRouter } from "./modules/reconciliation";
import { cartRouter } from "./modules/cart";
import { customerRouter } from "./modules/customer";
import { dashboardRouter } from "./modules/dashboard";
import { authMiddleware } from "./shared/middleware/auth.middleware";

export const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, data: { status: "ok" } });
});

app.use("/api/auth", authRouter);
app.use("/api/product", authMiddleware, productRouter);
app.use("/api/invoices", authMiddleware, invoiceRouter);
app.use("/api/inventory", authMiddleware, inventoryRouter);
app.use("/api/company-info", authMiddleware, companyRouter);
app.use("/api/reconciliation", authMiddleware, reconciliationRouter);
app.use("/api/cart", authMiddleware, cartRouter);
app.use("/api/customers", authMiddleware, customerRouter);
app.use("/api/dashboard", authMiddleware, dashboardRouter);
