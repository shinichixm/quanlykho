/**
 * Bu StockTransaction "in"/"out" con thieu cho cac InventoryAdjustment da tao
 * TRUOC khi createInventoryAdjustment duoc sua de tu tao StockTransaction kem theo.
 *
 * Trieu chung: san pham co Inventory.quantity > 0 (do dieu chinh tay) nhung van
 * khong hien ra o man tra soat hoa don (chon hang thay the) vi man do doi hoi ca
 * Inventory.quantity > 0 LAN co it nhat 1 StockTransaction type "in".
 *
 * Idempotent: bo qua san pham da co StockTransaction voi note bat dau
 * "Dieu chinh ton kho" (tuc da duoc backfill hoac da di qua code moi).
 *
 * Chay:  npx tsx scripts/backfill-adjustment-stocktxn.ts           (thuc thi)
 *        npx tsx scripts/backfill-adjustment-stocktxn.ts --dry     (chi in ra)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry") || process.argv.includes("--dry-run");

async function main() {
  const productsWithAdjustments = await prisma.inventoryAdjustment.findMany({
    select: { productId: true },
    distinct: ["productId"],
  });

  let created = 0;

  for (const { productId } of productsWithAdjustments) {
    const alreadyBackfilled = await prisma.stockTransaction.findFirst({
      where: { productId, note: { startsWith: "Điều chỉnh tồn kho" } },
    });
    if (alreadyBackfilled) continue;

    const sum = await prisma.inventoryAdjustment.aggregate({
      _sum: { quantity: true },
      where: { productId },
    });
    const net = Number(sum._sum.quantity ?? 0);
    if (net === 0) continue;

    console.log(
      `Product #${productId}: tạo StockTransaction ${net > 0 ? "in" : "out"} = ${Math.abs(net)}`
    );
    created += 1;

    if (!DRY_RUN) {
      await prisma.stockTransaction.create({
        data: {
          productId,
          type: net > 0 ? "in" : "out",
          quantity: Math.abs(net),
          invoiceId: null,
          note: "Điều chỉnh tồn kho (bù dữ liệu thiếu trước khi vá lỗi)",
        },
      });
    }
  }

  console.log(`Đã xử lý ${created} sản phẩm.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
