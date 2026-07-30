import { prisma } from "../../../shared/db/prisma";

export function findUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
}

export function findUserById(id: number) {
  return prisma.user.findUnique({ where: { id } });
}
