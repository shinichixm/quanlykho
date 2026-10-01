import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import {
  productInputSchema,
  productSearchSchema,
  productUpdateSchema,
} from "../schemas/product.schema";
import {
  createProduct,
  deleteProduct,
  findProductByCode,
  findProductById,
  findProductByNameKey,
  findProductList,
  updateProduct,
} from "../repositories/product.repository";
import { createInventoryAdjustment } from "../../inventory/repositories/inventory.repository";
import { normalizeKey } from "../../../shared/lib/normalize-key";
import {
  parseProductImportExcel,
  type ParsedProductImportRow,
} from "../lib/product-import-excel";
import type {
  ProductInput,
  ProductSearchInput,
  ProductUpdateInput,
} from "../types/product.types";

function generateProductCode() {
  return `AUTO-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function searchProduct(input: ProductSearchInput) {
  const parsed = productSearchSchema.parse(input);
  const skip = (parsed.page - 1) * parsed.pageSize;

  const { rows, total } = await findProductList({
    keyword: parsed.keyword,
    skip,
    take: parsed.pageSize,
  });

  return { rows, total };
}

export async function createProductService(input: ProductInput) {
  const parsed = productInputSchema.parse(input);

  const existedCode = await findProductByCode(parsed.code);
  if (existedCode) {
    throw new Error(`Mã hàng "${parsed.code}" đã tồn tại`);
  }

  const nameKey = normalizeKey(parsed.name);
  const unitKey = normalizeKey(parsed.unit);

  // Chặn tạo trùng sản phẩm đã có (cùng tên đã chuẩn hóa) — tránh lặp lại lỗi
  // tách sản phẩm mà hệ thống nạp hóa đơn gặp phải trước đây.
  const existedName = await findProductByNameKey(nameKey);
  if (existedName) {
    throw new Error(
      `Đã có sản phẩm cùng tên: "${existedName.name}" (mã ${existedName.code}). Dùng sản phẩm đó thay vì tạo mới.`
    );
  }

  return createProduct({ ...parsed, nameKey, unitKey });
}

export async function updateProductService(
  id: number,
  input: ProductUpdateInput
) {
  const parsed = productUpdateSchema.parse(input);

  const existed = await findProductById(id);
  if (!existed) {
    throw new Error("Không tìm thấy sản phẩm");
  }

  if (parsed.code && parsed.code !== existed.code) {
    const codeTaken = await findProductByCode(parsed.code);
    if (codeTaken) {
      throw new Error(`Mã hàng "${parsed.code}" đã tồn tại`);
    }
  }

  const keyUpdates = {
    ...(parsed.name !== undefined ? { nameKey: normalizeKey(parsed.name) } : {}),
    ...(parsed.unit !== undefined ? { unitKey: normalizeKey(parsed.unit) } : {}),
  };

  return updateProduct(id, { ...parsed, ...keyUpdates });
}

export async function deleteProductService(id: number) {
  const existed = await findProductById(id);
  if (!existed) {
    throw new Error("Không tìm thấy sản phẩm");
  }

  try {
    return await deleteProduct(id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new Error(
        "Không thể xóa: sản phẩm đã có hóa đơn hoặc giao dịch tồn kho liên quan. Nếu đây là sản phẩm bị trùng, hãy gộp thay vì xóa."
      );
    }
    throw error;
  }
}

export type ProductImportPreviewRow = ParsedProductImportRow & {
  existingProductId: number | null;
  existingProductCode: string | null;
};

export async function previewProductImportExcelService(
  buffer: Buffer
): Promise<ProductImportPreviewRow[]> {
  const rows = await parseProductImportExcel(buffer);
  const results: ProductImportPreviewRow[] = [];

  for (const row of rows) {
    if (row.error) {
      results.push({ ...row, existingProductId: null, existingProductCode: null });
      continue;
    }

    const existing = await findProductByNameKey(normalizeKey(row.name));
    results.push({
      ...row,
      existingProductId: existing?.id ?? null,
      existingProductCode: existing?.code ?? null,
    });
  }

  return results;
}

export type ProductImportResultRow = {
  rowIndex: number;
  name: string;
  success: boolean;
  created: boolean;
  error: string | null;
};

export async function importProductsFromExcelService(
  buffer: Buffer
): Promise<ProductImportResultRow[]> {
  const rows = await parseProductImportExcel(buffer);
  const results: ProductImportResultRow[] = [];

  for (const row of rows) {
    if (row.error) {
      results.push({
        rowIndex: row.rowIndex,
        name: row.name,
        success: false,
        created: false,
        error: row.error,
      });
      continue;
    }

    try {
      const nameKey = normalizeKey(row.name);
      const unitKey = normalizeKey(row.unit);

      // Trùng tên (đã chuẩn hóa) với sản phẩm có sẵn -> cộng vào tồn kho sản phẩm
      // đó thay vì tạo bản trùng mới, giống logic nạp hóa đơn.
      let product = await findProductByNameKey(nameKey);
      let created = false;

      if (!product) {
        product = await createProduct({
          code: generateProductCode(),
          name: row.name,
          unit: row.unit,
          nameKey,
          unitKey,
        });
        created = true;
      }

      if (row.quantity !== 0) {
        await createInventoryAdjustment({
          productId: product.id,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          note: "Nhập sản phẩm từ Excel",
        });
      }

      results.push({ rowIndex: row.rowIndex, name: row.name, success: true, created, error: null });
    } catch (error) {
      results.push({
        rowIndex: row.rowIndex,
        name: row.name,
        success: false,
        created: false,
        error: error instanceof Error ? error.message : "Lỗi không xác định",
      });
    }
  }

  return results;
}
