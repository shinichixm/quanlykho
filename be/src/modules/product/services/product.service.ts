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
  findProductList,
  updateProduct,
} from "../repositories/product.repository";
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

  const existed = await findProductByCode(parsed.code);
  if (existed) {
    throw new Error(`Mã hàng "${parsed.code}" đã tồn tại`);
  }

  return createProduct(parsed);
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

  return updateProduct(id, parsed);
}

export async function deleteProductService(id: number) {
  const existed = await findProductById(id);
  if (!existed) {
    throw new Error("Không tìm thấy sản phẩm");
  }

  return deleteProduct(id);
}
