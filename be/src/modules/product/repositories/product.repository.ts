import { prisma } from "../../../shared/db/prisma";
import type { ProductInput, ProductUpdateInput } from "../types/product.types";

export async function findProductList(params: {
  keyword?: string;
  skip: number;
  take: number;
}) {
  const where = params.keyword
    ? {
        OR: [
          { code: { contains: params.keyword } },
          { name: { contains: params.keyword } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { id: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  return { rows, total };
}

export function findProductById(id: number) {
  return prisma.product.findUnique({ where: { id } });
}

export function findProductByCode(code: string) {
  return prisma.product.findUnique({ where: { code } });
}

export function createProduct(input: ProductInput) {
  return prisma.product.create({ data: input });
}

export function updateProduct(id: number, input: ProductUpdateInput) {
  return prisma.product.update({ where: { id }, data: input });
}

export function deleteProduct(id: number) {
  return prisma.product.delete({ where: { id } });
}
