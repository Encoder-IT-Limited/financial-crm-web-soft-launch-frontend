import { newId, nextSequence } from "@/lib/format";
import type { NewPosSaleInput, NewRefundInput, PosRefund, PosSale } from "../types";
import { computeCartTotals, round2 } from "../types";
import { seedSales, seedSaleSeq } from "../mock/seed";
import { fulfillmentsApi } from "../../fulfillment/api/fulfillments.service";
import { productLookupApi } from "../../invoices/api/product-lookup.service";

/** Simulated network latency for the mock API. */
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

let sales: PosSale[] = seedSales;
let saleSeq: number = seedSaleSeq;
let refunds: PosRefund[] = [];

export const posSalesApi = {
  list: async (): Promise<PosSale[]> => {
    await delay(250);
    return sales;
  },

  get: async (id: string): Promise<PosSale | undefined> => {
    await delay(150);
    return sales.find((s) => s.id === id);
  },

  listRefunds: async (saleId?: string): Promise<PosRefund[]> => {
    await delay(150);
    return saleId ? refunds.filter((r) => r.saleId === saleId) : refunds;
  },

  /** The next auto-assigned sale number, e.g. "POS-000001" — its own
   * sequence, separate from INV- (client-confirmed, 4.7). */
  getNextNumber: async (): Promise<string> => {
    await delay(100);
    return `POS-${nextSequence(saleSeq, 6)}`;
  },

  /** Checkout — the sale is created and stock deducts in the same
   * action, no separate confirm step, mirroring how a real register
   * works (goods leave the moment the sale completes, per the
   * Fulfillment "automatic for POS" rule). */
  create: async (input: NewPosSaleInput): Promise<PosSale> => {
    await delay();
    const totals = computeCartTotals(input.lines, input.cartDiscount);
    const number = `POS-${nextSequence(saleSeq, 6)}`;
    const id = newId("sale");

    const fulfillment = await fulfillmentsApi.autoFulfillPos(
      id,
      input.lines.map((l, i) => ({
        invoiceLineId: `${id}-ln-${i}`,
        productId: l.productId,
        warehouseId: input.warehouseId,
        quantityFulfilled: l.quantity,
      }))
    );

    const sale: PosSale = {
      id,
      number,
      sessionId: input.sessionId,
      terminalId: input.terminalId,
      warehouseId: input.warehouseId,
      customerId: input.customerId,
      lines: input.lines,
      payments: input.payments,
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total,
      status: "completed",
      fulfillmentId: fulfillment.id,
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
    };
    sales = [sale, ...sales];
    saleSeq += 1;
    return sale;
  },

  /** Refund/return — always manager-PIN-gated by the caller before this
   * runs (client-confirmed rule). Sellable lines restock immediately
   * (reverses the original deduction); damaged lines are flagged only —
   * no real "quarantine" stock status exists in Inventory yet, so
   * nothing moves for those beyond recording the refund itself. */
  refund: async (input: NewRefundInput): Promise<PosRefund> => {
    await delay();
    const sale = sales.find((s) => s.id === input.saleId);
    if (!sale) throw new Error("Sale not found");

    let amount = 0;
    for (const line of input.lines) {
      if (line.quantity <= 0) continue;
      const saleLine = sale.lines.find((l) => l.productId === line.productId);
      if (!saleLine) continue;
      amount += round2(saleLine.unitPrice * line.quantity * (1 + saleLine.taxRate / 100));
      if (line.condition === "sellable") {
        await productLookupApi.deduct({ productId: line.productId, warehouseId: sale.warehouseId, quantity: -line.quantity });
      }
    }

    const refund: PosRefund = {
      id: newId("ref"),
      saleId: input.saleId,
      lines: input.lines,
      amount: round2(amount),
      reason: input.reason,
      approvedBy: input.approvedBy,
      createdAt: new Date().toISOString(),
    };
    refunds = [refund, ...refunds];

    const totalRefunded = refunds.filter((r) => r.saleId === input.saleId).reduce((sum, r) => sum + r.amount, 0);
    sales = sales.map((s) =>
      s.id === input.saleId ? { ...s, status: totalRefunded >= s.total - 0.005 ? "refunded" : "partially-refunded" } : s
    );

    return refund;
  },
};
