import type { PosSale, PosSession, PosTerminal } from "../types";

export const seedTerminals: PosTerminal[] = [
  { id: "term-front", name: "Front Counter", code: "POS-1", warehouseId: "wh-main", accessCode: "1111", status: "active" },
  { id: "term-2", name: "Back Counter", code: "POS-2", warehouseId: "wh-dxb", accessCode: "2222", status: "active" },
];

/** One closed session from "yesterday" so Sessions/Sales history has
 * something to show without needing to run a live sale first. */
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export const seedSessions: PosSession[] = [
  {
    id: "sess-0001",
    terminalId: "term-front",
    openedBy: "Amir K.",
    openedAt: hoursAgo(30),
    openingCash: 200,
    closedAt: hoursAgo(22),
    closingCashCounted: 427.75,
    expectedCash: 425.75,
    variance: 2,
    status: "closed",
  },
];

export const seedSales: PosSale[] = [
  {
    id: "sale-0001",
    number: "POS-000001",
    sessionId: "sess-0001",
    terminalId: "term-front",
    warehouseId: "wh-main",
    lines: [
      { productId: "plu-9", name: "A4 Copy Paper Ream", sku: "PP-A4-80G", unitPrice: 22, quantity: 5, taxRate: 5 },
      { productId: "plu-10", name: "Ballpoint Pens Box 50", sku: "PN-BLU-50", unitPrice: 35, quantity: 3, taxRate: 5 },
    ],
    payments: [{ method: "cash", amount: 225.75 }],
    subtotal: 215,
    discount: 0,
    tax: 10.75,
    total: 225.75,
    status: "completed",
    fulfillmentId: "seed-fulfillment-0001",
    createdBy: "Amir K.",
    createdAt: hoursAgo(29),
  },
];

export const seedSaleSeq = 2; // next auto-assigned number is POS-000002
