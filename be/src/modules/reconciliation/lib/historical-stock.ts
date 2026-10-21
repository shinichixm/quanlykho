/**
 * Tính tồn kho "tại đúng thời điểm từng hóa đơn bán" thay vì lấy tồn kho hiện tại
 * (thời gian thực) của sản phẩm.
 *
 * Lý do: Inventory.quantity là số tồn CHUNG, dùng chung cho mọi hóa đơn bán sản
 * phẩm đó. Nếu 1 sản phẩm bị bán vượt tồn do nhiều hóa đơn cộng dồn (VD nhập 5,
 * bán rải rác 6 hóa đơn mỗi hóa đơn 1 cái), tồn kho hiện tại âm khiến TẤT CẢ các
 * hóa đơn đó đều bị báo "Âm kho" — trong khi thực ra chỉ hóa đơn khiến tồn kho
 * vượt ngưỡng 0 (thường là hóa đơn cuối cùng theo thời gian) mới thực sự thiếu
 * hàng; các hóa đơn bán trước đó đã được đáp ứng đủ bằng hàng thật trong kho.
 *
 * Hàm này mô phỏng lại dòng chảy tồn kho của từng sản phẩm theo thứ tự thời
 * gian (nhập hàng, điều chỉnh tồn kho, bị dùng làm hàng thay thế cho hóa đơn
 * khác, và chính các hóa đơn bán) để suy ra số tồn NGAY SAU từng hóa đơn bán cụ
 * thể — đây mới là con số dùng để xác định hóa đơn đó có thực sự "âm kho" hay
 * không.
 */

type Decimalish = { toString(): string };

export type ProductMovementsInput = {
  purchaseItems: { productId: number; quantity: Decimalish; invoiceId: number; issuedAt: Date }[];
  saleItems: {
    invoiceItemId: number;
    productId: number;
    quantity: Decimalish;
    invoiceId: number;
    issuedAt: Date;
  }[];
  adjustments: { id: number; productId: number; quantity: Decimalish; adjustedAt: Date }[];
  substitutionsUsed: {
    id: number;
    substituteProductId: number;
    quantity: Decimalish;
    createdAt: Date;
  }[];
};

type Movement = {
  at: number; // epoch ms
  // Khi trùng thời điểm: ưu tiên khoản "vào" trước "ra" (coi như hàng về trước khi bán
  // trong cùng ngày), rồi mới tới thứ tự nhập liệu (id) để ổn định, có thể tái lập.
  isInflow: 0 | 1;
  entityId: number;
  delta: number;
  saleInvoiceItemId?: number;
};

// Trả về Map<invoiceItemId, tồn kho NGAY SAU khi hóa đơn bán đó được trừ kho>.
export function computeHistoricalSaleBalances(
  input: ProductMovementsInput
): Map<number, number> {
  const byProduct = new Map<number, Movement[]>();

  function push(productId: number, movement: Movement) {
    const arr = byProduct.get(productId);
    if (arr) arr.push(movement);
    else byProduct.set(productId, [movement]);
  }

  for (const p of input.purchaseItems) {
    push(p.productId, {
      at: p.issuedAt.getTime(),
      isInflow: 0,
      entityId: p.invoiceId,
      delta: Number(p.quantity),
    });
  }

  for (const a of input.adjustments) {
    const qty = Number(a.quantity);
    push(a.productId, {
      at: a.adjustedAt.getTime(),
      isInflow: qty >= 0 ? 0 : 1,
      entityId: a.id,
      delta: qty,
    });
  }

  for (const s of input.substitutionsUsed) {
    push(s.substituteProductId, {
      at: s.createdAt.getTime(),
      isInflow: 1,
      entityId: s.id,
      delta: -Number(s.quantity),
    });
  }

  for (const sale of input.saleItems) {
    push(sale.productId, {
      at: sale.issuedAt.getTime(),
      isInflow: 1,
      entityId: sale.invoiceId,
      delta: -Number(sale.quantity),
      saleInvoiceItemId: sale.invoiceItemId,
    });
  }

  const result = new Map<number, number>();

  for (const movements of byProduct.values()) {
    movements.sort((a, b) => {
      if (a.at !== b.at) return a.at - b.at;
      if (a.isInflow !== b.isInflow) return a.isInflow - b.isInflow;
      return a.entityId - b.entityId;
    });

    let balance = 0;
    for (const movement of movements) {
      balance += movement.delta;
      if (movement.saleInvoiceItemId !== undefined) {
        result.set(movement.saleInvoiceItemId, balance);
      }
    }
  }

  return result;
}
