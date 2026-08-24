import { apiGet, apiSend } from "@/lib/api/envelope";

export type PosTerminal = {
  id: string;
  name: string;
  code: string;
  warehouseId: string;
  status: string;
};

export type PosSession = {
  id: string;
  terminalId: string;
  status: string;
  openingCash: number | string;
  closingCash?: number | string | null;
  expectedCash?: number | string | null;
  variance?: number | string | null;
  openedAt?: string;
  closedAt?: string | null;
  terminal?: PosTerminal;
};

export type PosSaleItem = {
  id: string;
  productId: string;
  quantity: number | string;
  unitPrice: number | string;
  discount?: number | string;
  tax?: number | string;
  total?: number | string;
};

export type PosSale = {
  id: string;
  transactionNumber: string;
  total: number | string;
  status: string;
  createdAt: string;
  posSessionId: string | null;
  items?: PosSaleItem[];
};

export type RefundSaleItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  condition: "SELLABLE" | "DAMAGED";
};

export const posApi = {
  listTerminals: () => apiGet<PosTerminal[]>("/pos/terminals"),
  createTerminal: (input: { name: string; code: string; warehouseId: string }) =>
    apiSend<PosTerminal>("post", "/pos/terminals", input),

  listSessions: (status?: "OPEN" | "CLOSED") =>
    apiGet<PosSession[]>("/pos/sessions", status ? { params: { status } } : undefined),

  openSession: (input: { terminalId: string; openingCash: number }) =>
    apiSend<PosSession>("post", "/pos/sessions", input),
  closeSession: (id: string, closingCash: number) =>
    apiSend("post", `/pos/sessions/${id}/close`, { closingCash }),

  listSales: () => apiGet<PosSale[]>("/pos/sales"),
  getSale: (id: string) => apiGet<PosSale>(`/pos/sales/${id}`),
  createSale: (input: {
    posSessionId: string;
    customerId?: string;
    items: { productId: string; quantity: number; unitPrice: number; discount?: number; tax?: number }[];
    payments: { paymentMethod: "CASH" | "CARD" | "BANK" | "MOBILE_PAYMENT" | "CHEQUE" | "OTHER"; amount: number }[];
  }) =>
    apiSend("post", "/pos/sales", {
      ...input,
      items: input.items.map((i) => ({ ...i, discount: i.discount ?? 0, tax: i.tax ?? 0 })),
    }),

  refundSale: (id: string, items: RefundSaleItem[], reason?: string) =>
    apiSend<{ sale: PosSale }>("post", `/pos/sales/${id}/refund`, { items, reason }),

  voidSale: (id: string) => apiSend<{ sale: PosSale }>("post", `/pos/sales/${id}/void`),
};
