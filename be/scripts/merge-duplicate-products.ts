/**
 * Don du lieu san pham bi tach do so khop ten theo chuoi goc.
 *
 *   1. Tinh lai Product.nameKey / Product.unitKey theo normalizeKey().
 *   2. Gop cac san pham CUNG TEN (nameKey) - khong xet don vi tinh, vi cung 1
 *      mat hang nhung don vi ghi khac nhau giua cac hoa don van la 1 san pham.
 *      Giu id nho nhat lam chuan, tro toan bo InvoiceItem / StockTransaction /
 *      ReconciliationSubstitution ve id chuan, roi xoa ban ghi thua.
 *   3. Tinh lai ton kho (Inventory) cua san pham chuan = tong SL mua - tong SL ban
 *      theo hoa don, de so ton khop dung voi chung tu.
 *
 * Chay:  npm run fix:products              (thuc thi)
 *        npm run fix:products -- --dry     (chi in ra, khong doi du lieu)
 *
 * Idempotent: chay lai nhieu lan van an toan. Ca hai che do deu gom nhom theo
 * key vua tinh lai trong bo nho (khong doc lai DB) nen --dry phan anh dung
 * ket qua se xay ra khi chay that.
 */
import { Prisma, PrismaClient } from "@prisma/client";
import { normalizeKey } from "../src/shared/lib/normalize-key";

const prisma = new PrismaClient();
const DRY_RUN =
  process.argv.includes("--dry") || process.argv.includes("--dry-run");

function log(...args: unknown[]) {
  console.log(...args);
}

type ProductRow = {
  id: number;
  code: string;
  name: string;
  unit: string;
  nameKey: string;
  unitKey: string;
};

async function computeKeys(): Promise<{
  products: ProductRow[];
  freshNameKey: Map<number, string>;
}> {
  const products = await prisma.product.findMany({
    select: { id: true, code: true, name: true, unit: true, nameKey: true, unitKey: true },
    orderBy: { id: "asc" },
  });

  const freshNameKey = new Map<number, string>();
  let updated = 0;

  for (const p of products) {
    const nameKey = normalizeKey(p.name);
    const unitKey = normalizeKey(p.unit);
    freshNameKey.set(p.id, nameKey);

    if (nameKey === p.nameKey && unitKey === p.unitKey) continue;

    updated += 1;
    if (!DRY_RUN) {
      await prisma.product.update({
        where: { id: p.id },
        data: { nameKey, unitKey },
      });
    }
  }

  log(`Chuan hoa khoa: ${updated}/${products.length} san pham can cap nhat.`);
  return { products, freshNameKey };
}

async function recalcInventory(productId: number) {
  const [inSum, outSum] = await Promise.all([
    prisma.invoiceItem.aggregate({
      _sum: { quantity: true },
      where: { productId, invoice: { type: "purchase" } },
    }),
    prisma.invoiceItem.aggregate({
      _sum: { quantity: true },
      where: { productId, invoice: { type: "sale" } },
    }),
  ]);

  const totalIn = inSum._sum.quantity ?? new Prisma.Decimal(0);
  const totalOut = outSum._sum.quantity ?? new Prisma.Decimal(0);
  const quantity = totalIn.minus(totalOut);

  if (!DRY_RUN) {
    await prisma.inventory.upsert({
      where: { productId },
      create: { productId, quantity },
      update: { quantity },
    });
  }
  return quantity;
}

async function mergeDuplicates(
  products: ProductRow[],
  freshNameKey: Map<number, string>
) {
  const groups = new Map<string, ProductRow[]>();
  for (const p of products) {
    const key = freshNameKey.get(p.id)!;
    const arr = groups.get(key);
    if (arr) arr.push(p);
    else groups.set(key, [p]);
  }

  const dupGroups = [...groups.values()].filter((g) => g.length > 1);
  log(`Tim thay ${dupGroups.length} nhom san pham trung.`);

  for (const group of dupGroups) {
    const [canonical, ...dups] = group;
    const dupIds = dups.map((d) => d.id);
    log(
      `- Giu #${canonical.id} (${canonical.code}); gop ${dups.length} ban trung: ` +
        dupIds.map((id) => `#${id}`).join(", ")
    );
    log(`    "${canonical.name.slice(0, 80).replace(/\s+/g, " ")}..."`);

    if (DRY_RUN) continue;

    await prisma.$transaction(async (tx) => {
      for (const dupId of dupIds) {
        await tx.invoiceItem.updateMany({
          where: { productId: dupId },
          data: { productId: canonical.id },
        });
        await tx.stockTransaction.updateMany({
          where: { productId: dupId },
          data: { productId: canonical.id },
        });
        await tx.reconciliationSubstitution.updateMany({
          where: { substituteProductId: dupId },
          data: { substituteProductId: canonical.id },
        });
        await tx.inventory.deleteMany({ where: { productId: dupId } });
        await tx.product.delete({ where: { id: dupId } });
      }
    });
  }

  return dupGroups;
}

async function main() {
  log(
    DRY_RUN
      ? "== CHE DO DRY-RUN (khong doi du lieu) =="
      : "== Bat dau don du lieu =="
  );

  const { products, freshNameKey } = await computeKeys();
  const dupGroups = await mergeDuplicates(products, freshNameKey);

  const canonicalIds = dupGroups.map((g) => g[0].id);
  for (const id of canonicalIds) {
    const qty = await recalcInventory(id);
    log(`  Ton kho #${id} = ${qty.toString()}`);
  }

  log("== Hoan tat ==");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
