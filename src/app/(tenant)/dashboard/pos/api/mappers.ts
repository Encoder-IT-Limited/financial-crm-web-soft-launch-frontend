import type {
  CartLine,
  NewPosSaleInput,
  NewPosTerminalInput,
  NewRefundInput,
  PosPayment,
  PosPaymentMethod,
  PosRefund,
  PosSale,
  PosSaleStatus,
  PosSession,
  PosSessionStatus,
  PosTerminal,
  PosTerminalStatus,
  RefundLineCondition,
} from "../types";
import { round2 } from "../types";

export type ApiPosTerminal = {
  id: string;
  name: string;
  code: string;
  warehouseId: string;
  status: string;
  hasAccessCode?: boolean;
  deviceIdentifier?: string | null;
};

export type ApiPosSession = {
  id: string;
  terminalId: string;
  cashierId: string;
  cashierName?: string | null;
  status: string;
  openingCash: number | string;
  closingCash?: number | string | null;
  expectedCash?: number | string | null;
  variance?: number | string | null;
  openedAt: string;
  closedAt?: string | null;
  terminal?: ApiPosTerminal;
};

export type ApiSaleItem = {
  id?: string;
  productId: string;
  quantity: number | string;
  unitPrice: number | string;
  discount?: number | string;
  tax?: number | string;
  total?: number | string;
  discountRuleId?: string | null;
};

export type ApiPayment = {
  id?: string;
  paymentMethod: string;
  amount: number | string;
  tenderedAmount?: number | string | null;
  currency?: string | null;
};

export type ApiSaleReturn = {
  id: string;
  saleId?: string;
  refundAmount: number | string;
  reason?: string | null;
  approvedBy?: string | null;
  createdAt: string;
  items: {
    productId: string;
    quantity: number | string;
    unitPrice: number | string;
    condition: string;
  }[];
};

export type ApiPosSale = {
  id: string;
  transactionNumber: string;
  posSessionId: string | null;
  warehouseId: string;
  customerId?: string | null;
  subtotal: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;
  status: string;
  createdAt: string;
  items?: ApiSaleItem[];
  payments?: ApiPayment[];
  returns?: ApiSaleReturn[];
  invoiceId?: string | null;
  terminalId?: string | null;
};

const PAYMENT_TO_API: Record<PosPaymentMethod, string> = {
  cash: "CASH",
  card: "CARD",
  "mobile-payment": "MOBILE_PAYMENT",
};

const PAYMENT_FROM_API: Record<string, PosPaymentMethod> = {
  CASH: "cash",
  CARD: "card",
  MOBILE_PAYMENT: "mobile-payment",
};

function n(v: number | string | null | undefined): number {
  return Number(v ?? 0);
}

export function mapTerminalStatus(status: string): PosTerminalStatus {
  return status.toUpperCase() === "ACTIVE" ? "active" : "inactive";
}

export function mapTerminal(row: ApiPosTerminal): PosTerminal {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    warehouseId: row.warehouseId,
    // UI still shows/edits access code; hash never leaves the server.
    accessCode: row.hasAccessCode ? "••••" : "",
    status: mapTerminalStatus(row.status),
  };
}

export function mapSession(row: ApiPosSession): PosSession {
  return {
    id: row.id,
    terminalId: row.terminalId,
    cashierId: row.cashierId,
    openedBy: row.cashierName?.trim() || "Cashier",
    openedAt: row.openedAt,
    openingCash: n(row.openingCash),
    closedAt: row.closedAt ?? undefined,
    closingCashCounted: row.closingCash != null ? n(row.closingCash) : undefined,
    expectedCash: row.expectedCash != null ? n(row.expectedCash) : undefined,
    variance: row.variance != null ? n(row.variance) : undefined,
    status: row.status.toUpperCase() === "OPEN" ? "open" : "closed",
  };
}

export function mapSaleStatus(status: string): PosSaleStatus {
  switch (status.toUpperCase()) {
    case "PARTIALLY_REFUNDED":
      return "partially-refunded";
    case "REFUNDED":
      return "refunded";
    default:
      return "completed";
  }
}

export function mapPaymentMethod(method: string): PosPaymentMethod {
  return PAYMENT_FROM_API[method] ?? "cash";
}

export function mapSale(
  row: ApiPosSale,
  opts: {
    terminalId?: string;
    productMeta?: Map<string, { name: string; sku: string; taxRate: number }>;
    createdBy?: string;
    createdByCashierId?: string;
  } = {},
): PosSale {
  const meta = opts.productMeta ?? new Map();
  const lines: CartLine[] = (row.items ?? []).map((item) => {
    const info = meta.get(item.productId);
    const qty = n(item.quantity);
    const unitPrice = n(item.unitPrice);
    const tax = n(item.tax);
    const taxRate = qty * unitPrice > 0 ? round2((tax / (qty * unitPrice)) * 100) : info?.taxRate ?? 5;
    return {
      productId: item.productId,
      name: info?.name ?? "Item",
      sku: info?.sku ?? "",
      unitPrice,
      quantity: qty,
      taxRate,
      discountAmount: n(item.discount) || undefined,
    };
  });

  return {
    id: row.id,
    number: row.transactionNumber,
    sessionId: row.posSessionId ?? "",
    terminalId: opts.terminalId ?? row.terminalId ?? "",
    warehouseId: row.warehouseId,
    customerId: row.customerId ?? undefined,
    lines,
    payments: (row.payments ?? [])
      .filter((p) => n(p.amount) > 0)
      .map((p) => ({
        method: mapPaymentMethod(p.paymentMethod),
        amount: n(p.amount),
        tenderedAmount: p.tenderedAmount != null ? n(p.tenderedAmount) : undefined,
      })),
    subtotal: n(row.subtotal),
    discount: n(row.discount),
    tax: n(row.tax),
    total: n(row.total),
    status: mapSaleStatus(row.status),
    fulfillmentId: row.invoiceId ?? undefined,
    createdBy: opts.createdBy ?? "Cashier",
    createdByCashierId: opts.createdByCashierId,
    createdAt: row.createdAt,
  };
}

export function mapReturns(saleId: string, returns: ApiSaleReturn[] | undefined): PosRefund[] {
  return (returns ?? []).map((r) => ({
    id: r.id,
    saleId,
    lines: r.items.map((i) => ({
      productId: i.productId,
      quantity: n(i.quantity),
      condition: (i.condition.toUpperCase() === "DAMAGED" ? "damaged" : "sellable") as RefundLineCondition,
    })),
    amount: n(r.refundAmount),
    reason: r.reason ?? "",
    approvedBy: r.approvedBy ?? "Manager",
    createdAt: r.createdAt,
  }));
}

export function toApiTerminalCreate(input: NewPosTerminalInput) {
  return {
    name: input.name,
    code: input.code,
    warehouseId: input.warehouseId,
    accessCode: input.accessCode,
  };
}

export function toApiTerminalUpdate(input: NewPosTerminalInput & { status?: PosTerminalStatus }) {
  const body: Record<string, unknown> = {
    name: input.name,
    code: input.code,
    warehouseId: input.warehouseId,
  };
  if (input.accessCode && input.accessCode !== "••••") body.accessCode = input.accessCode;
  if (input.status) body.status = input.status === "active" ? "ACTIVE" : "INACTIVE";
  return body;
}

/** Distribute cart-level discount across lines proportional to line gross. */
export function distributeCartDiscount(lines: CartLine[], cartDiscount: number): CartLine[] {
  if (cartDiscount <= 0 || lines.length === 0) return lines;
  const gross = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  if (gross <= 0) return lines;
  let remaining = round2(cartDiscount);
  return lines.map((line, idx) => {
    const lineGross = line.quantity * line.unitPrice;
    const share =
      idx === lines.length - 1 ? remaining : round2((lineGross / gross) * cartDiscount);
    remaining = round2(remaining - share);
    return { ...line, discountAmount: round2((line.discountAmount ?? 0) + share) };
  });
}

export function toApiCreateSale(
  input: NewPosSaleInput,
  managerPin?: string,
): {
  posSessionId: string;
  customerId?: string;
  items: { productId: string; quantity: number; unitPrice: number; discount: number }[];
  payments: { paymentMethod: string; amount: number; tenderedAmount?: number }[];
  managerPin?: string;
} {
  const lines = distributeCartDiscount(input.lines, input.cartDiscount);
  const due = round2(
    lines.reduce((sum, l) => {
      const gross = l.quantity * l.unitPrice;
      const disc = l.discountAmount ?? 0;
      const tax = ((gross - disc) * l.taxRate) / 100;
      return sum + gross - disc + tax;
    }, 0),
  );
  let payments = input.payments.map((p) => ({
    paymentMethod: PAYMENT_TO_API[p.method],
    amount: p.amount,
    tenderedAmount: p.tenderedAmount,
  }));
  const paid = round2(payments.reduce((s, p) => s + p.amount, 0));
  if (paid > due + 0.009) {
    const cashIdx = payments.findIndex((p) => p.paymentMethod === "CASH");
    if (cashIdx >= 0) {
      const over = round2(paid - due);
      payments = payments.map((p, i) =>
        i === cashIdx
          ? { ...p, tenderedAmount: p.tenderedAmount ?? p.amount, amount: round2(p.amount - over) }
          : p,
      );
    }
  }

  return {
    posSessionId: input.sessionId,
    customerId: input.customerId,
    items: lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discount: l.discountAmount ?? 0,
    })),
    payments: payments.map((p) => ({
      paymentMethod: p.paymentMethod,
      amount: p.amount,
      ...(p.tenderedAmount != null && p.tenderedAmount > p.amount + 0.009
        ? { tenderedAmount: p.tenderedAmount }
        : {}),
    })),
    managerPin,
  };
}

export function toApiRefund(
  input: NewRefundInput,
  sale: PosSale,
  managerPin: string,
): {
  items: { productId: string; quantity: number; unitPrice: number; condition: "SELLABLE" | "DAMAGED" }[];
  reason?: string;
  managerPin: string;
} {
  return {
    items: input.lines.map((l) => {
      const saleLine = sale.lines.find((s) => s.productId === l.productId);
      return {
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: saleLine?.unitPrice ?? 0,
        condition: l.condition === "damaged" ? "DAMAGED" : "SELLABLE",
      };
    }),
    reason: input.reason || undefined,
    managerPin,
  };
}

export type { PosSessionStatus };
