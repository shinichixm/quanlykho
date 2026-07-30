import {
  customerInputSchema,
  customerSearchSchema,
  customerUpdateSchema,
} from "../schemas/customer.schema";
import {
  createCustomer,
  deleteCustomer,
  findCustomerById,
  findCustomerList,
  updateCustomer,
} from "../repositories/customer.repository";
import type {
  CustomerInput,
  CustomerSearchInput,
  CustomerUpdateInput,
} from "../types/customer.types";

export async function searchCustomer(input: CustomerSearchInput) {
  const parsed = customerSearchSchema.parse(input);
  const skip = (parsed.page - 1) * parsed.pageSize;

  const { rows, total } = await findCustomerList({
    keyword: parsed.keyword,
    skip,
    take: parsed.pageSize,
  });

  return { rows, total };
}

export async function createCustomerService(input: CustomerInput) {
  const parsed = customerInputSchema.parse(input);
  return createCustomer(parsed);
}

export async function updateCustomerService(id: number, input: CustomerUpdateInput) {
  const parsed = customerUpdateSchema.parse(input);

  const existed = await findCustomerById(id);
  if (!existed) {
    throw new Error("Không tìm thấy khách hàng");
  }

  return updateCustomer(id, parsed);
}

export async function deleteCustomerService(id: number) {
  const existed = await findCustomerById(id);
  if (!existed) {
    throw new Error("Không tìm thấy khách hàng");
  }

  return deleteCustomer(id);
}
