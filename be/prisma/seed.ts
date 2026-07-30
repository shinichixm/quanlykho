import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "123456";
const ADMIN_EMAIL = "dbtuanxm@gmail.com";

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    update: {},
    create: {
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: passwordHash,
      fullName: "Quản trị viên",
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(`Đã tạo/xác nhận tài khoản admin: ${admin.username}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
