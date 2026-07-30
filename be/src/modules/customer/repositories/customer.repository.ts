import { prisma } from "../../../shared/db/prisma";
import type { CustomerInput, CustomerUpdateInput } from "../types/customer.types";

export async function findCustomerList(params: {
  keyword?: string;
  skip: number;
  take: number;
}) {
  const where = params.keyword
    ? {
        OR: [
          { name: { contains: params.keyword } },
          { taxCode: { contains: params.keyword } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { id: "desc" },
    }),
    prisma.customer.count({ where }),
  ]);

  return { rows, total };
}

export function findCustomerById(id: number) {
  return prisma.customer.findUnique({ where: { id } });
}

export function createCustomer(input: CustomerInput) {
  return prisma.customer.create({ data: input });
}

export function updateCustomer(id: number, input: CustomerUpdateInput) {
  return prisma.customer.update({ where: { id }, data: input });
}

export function deleteCustomer(id: number) {
  return prisma.customer.delete({ where: { id } });
}
