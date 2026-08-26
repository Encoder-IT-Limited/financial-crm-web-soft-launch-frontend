/* ------------------------------------------------------------------ */
/* POS — web register demo (docs/plans/POS-Implementation-Plan.md).    */
/* Single base currency (AED) for this demo, no per-transaction FX     */
/* like Invoices' Currency field. Deducts stock via the same           */
/* fulfillmentsApi.autoFulfillPos() path Fulfillment already exposes — */
/* this is that function's first real caller.                         */
/*                                                                      */
/* "Terminal" (matching the client's own SRS schema, pos_terminals) is */
/* the physical station; "Session" is one shift on it. Kept as two      */
/* distinct words deliberately — "Register" was overloaded as both the */
/* entity and the open/close verb, which was the actual source of      */
/* confusion this rename resolves.                                     */
/* ------------------------------------------------------------------ */

export type PosTerminalStatus = "active" | "inactive";

/** A terminal is admin config, not a "device" — no enrollment flow,
 * just a name/code linked to one warehouse (client-confirmed: every
 * sale through a terminal deducts from that terminal's warehouse).
 * `accessCode` gates who can start a shift on it (see PosSession) —
 * deliberately separate from the manager-approval PIN used for
 * discounts/refunds, since the two authorize different things. */
export type PosTerminal = {
  id: string;
  name: string;
  code: string;
  warehouseId: string;
  accessCode: string;
  status: PosTerminalStatus;
};

export type NewPosTerminalInput = {
  name: string;
  code: string;
  warehouseId: string;
  accessCode: string;
};

export type PosSessionStatus = "open" | "closed";

/** One open→close shift on a terminal. `openedBy` is the only link
 * between a terminal and a specific cashier — it exists only for the
 * lifetime of the session, not permanently. Set by the cashier-login
 * step in OpenSessionDialog (username + the terminal's access code),
 * not a hardcoded identity. */
export type PosSession = {
  id: string;
  terminalId: string;
  openedBy: string;
  openedAt: string;
  openingCash: number;
  closedAt?: string;
  closingCashCounted?: number;
  expectedCash?: number;
  variance?: number;
  status: PosSessionStatus;
};

export type NewPosSessionInput = {
  terminalId: string;
  openedBy: string;
  openingCash: number;
};

/** Client-side cart state — never persisted on its own, becomes a
 * PosSale's lines on checkout. */
export type CartLine = {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  taxRate: number;
  discountAmount?: number;
};

export type PosPaymentMethod = "cash" | "card" | "mobile-payment";

export const POS_PAYMENT_METHOD_LABELS: Record<PosPaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  "mobile-payment": "Mobile Payment",
};

/** Split tender = more than one entry here. */
export type PosPayment = { method: PosPaymentMethod; amount: number };

export type PosSaleStatus = "completed" | "partially-refunded" | "refunded";

export type PosSale = {
  id: string;
  number: string; // POS-000001 — own sequence, separate from INV- (client-confirmed)
  sessionId: string;
  terminalId: string;
  /** Denormalized from the terminal at sale time — lets refunds restock
   * without a cross-service terminal lookup, and survives a terminal
   * being edited/deactivated later. */
  warehouseId: string;
  customerId?: string;
  lines: CartLine[];
  payments: PosPayment[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: PosSaleStatus;
  /** Set once autoFulfillPos() runs — stock already deducted by the time
   * this is non-null. Always set on create; optional only for the type
   * to stay honest about the moment before that call resolves. */
  fulfillmentId?: string;
  createdBy: string;
  createdAt: string;
};

export type NewPosSaleInput = {
  terminalId: string;
  warehouseId: string;
  sessionId: string;
  /** The session's own openedBy — whoever logged into this terminal for
   * this shift, not a separate "who's ringing this up" concept. */
  createdBy: string;
  customerId?: string;
  lines: CartLine[];
  cartDiscount: number; // additional discount on top of any per-line discounts
  payments: PosPayment[];
  managerPin?: string;
};

/** A returned line either goes back to sellable stock, or is flagged damaged. */
export type RefundLineCondition = "sellable" | "damaged";

export type RefundLineInput = { productId: string; quantity: number; condition: RefundLineCondition };

export type PosRefund = {
  id: string;
  saleId: string;
  lines: RefundLineInput[];
  amount: number;
  reason: string;
  approvedBy: string;
  createdAt: string;
};

export type NewRefundInput = {
  saleId: string;
  lines: RefundLineInput[];
  reason: string;
  approvedBy: string;
  managerPin?: string;
};

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export type CartTotals = { subtotal: number; discount: number; tax: number; total: number };

export function computeCartTotals(lines: CartLine[], cartDiscount = 0): CartTotals {
  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const lineDiscounts = lines.reduce((sum, l) => sum + (l.discountAmount ?? 0), 0);
  const discount = round2(lineDiscounts + cartDiscount);
  const tax = lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice * l.taxRate) / 100, 0);
  return { subtotal: round2(subtotal), discount, tax: round2(tax), total: round2(subtotal - discount + tax) };
}

export function paymentsTotal(payments: PosPayment[]): number {
  return round2(payments.reduce((sum, p) => sum + p.amount, 0));
}

/** Cash expected in the drawer at close: opening float + every cash
 * payment on a sale made during this session − every refund issued
 * against one of those sales (assumed paid back in cash for this
 * demo — a real build would track the refund's own payment method). */
export function expectedCashForSession(session: PosSession, sales: PosSale[], refunds: PosRefund[]): number {
  const sessionSaleIds = new Set(sales.filter((s) => s.sessionId === session.id).map((s) => s.id));
  const cashSales = sales
    .filter((s) => sessionSaleIds.has(s.id))
    .reduce((sum, s) => sum + s.payments.filter((p) => p.method === "cash").reduce((a, p) => a + p.amount, 0), 0);
  const cashRefunds = refunds.filter((r) => sessionSaleIds.has(r.saleId)).reduce((sum, r) => sum + r.amount, 0);
  return round2(session.openingCash + cashSales - cashRefunds);
}

export function saleRefundedAmount(saleId: string, refunds: PosRefund[]): number {
  return round2(refunds.filter((r) => r.saleId === saleId).reduce((sum, r) => sum + r.amount, 0));
}
