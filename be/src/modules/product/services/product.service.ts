import { Prisma } from "@prisma/client";
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
import { normalizeKey } from "../../../shared/lib/normalize-key";
import type {
  ProductInput,
  ProductSearchInput,
  ProductUpdateInput,
} from "../types/product.types";

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
