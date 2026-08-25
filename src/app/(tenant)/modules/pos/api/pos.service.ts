import { apiGet, apiSend } from "@/lib/api/envelope";
import { mapProduct, type ApiProduct } from "@/app/(tenant)/modules/inventory/api/inventory.service";
import type { Product } from "@/app/(tenant)/modules/inventory/types";

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
  cashierId?: string;
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
  discountRuleId?: string | null;
};

export type PosPayment = {
  id: string;
  paymentMethod: string;
  amount: number | string;
  paymentDate?: string;
};

export type PosSale = {
  id: string;
  transactionNumber: string;
  total: number | string;
  subtotal?: number | string;
  discount?: number | string;
  tax?: number | string;
  status: string;
  createdAt: string;
  transactionDate?: string;
  posSessionId: string | null;
  customerId?: string | null;
  invoiceId?: string | null;
  items?: PosSaleItem[];
  payments?: PosPayment[];
  invoice?: { id: string; invoiceNumber: string; status: string } | null;
};

export type RefundSaleItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  condition: "SELLABLE" | "DAMAGED";
};

export type PosDiscountRule = {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED";
  value: number | string;
  active: boolean;
};

export type PaymentMethod = "CASH" | "CARD" | "BANK" | "MOBILE_PAYMENT" | "CHEQUE" | "OTHER";

export type SaleItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  discountRuleId?: string;
};

export type SalePaymentInput = {
  paymentMethod: PaymentMethod;
  amount: number;
  transactionReference?: string;
};

export type PosReceipt = {
  transactionNumber: string;
  transactionDate: string;
  status: string;
  terminal: { id: string; name: string; code: string } | null;
  cashier: { id: string; name: string } | null;
  customer: { id: string | null; name: string; customerCode?: string };
  warehouseId: string;
  items: PosSaleItem[];
  subtotal: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;
  payments: PosPayment[];
  invoice: { id: string; invoiceNumber: string; status: string } | null;
  openCashDrawer: boolean;
  print: { protocol: string; paperWidthMm: number; drawerKick: boolean };
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
    apiSend<PosSession>("post", `/pos/sessions/${id}/close`, { closingCash }),

  listSales: (posSessionId?: string) =>
    apiGet<PosSale[]>("/pos/sales", posSessionId ? { params: { posSessionId } } : undefined),
  getSale: (id: string) => apiGet<PosSale>(`/pos/sales/${id}`),
  getReceipt: (id: string) => apiGet<PosReceipt>(`/pos/sales/${id}/receipt`),

  createSale: (input: {
    posSessionId: string;
    customerId?: string;
    items: SaleItemInput[];
    payments: SalePaymentInput[];
    managerPin?: string;
    isOfflineSync?: boolean;
  }) => apiSend<PosSale>("post", "/pos/sales", input),

  refundSale: (id: string, items: RefundSaleItem[], reason?: string, managerPin?: string) =>
    apiSend<{ sale: PosSale }>("post", `/pos/sales/${id}/refund`, { items, reason, managerPin }),

  voidSale: (id: string, managerPin?: string) =>
    apiSend<{ sale: PosSale }>("post", `/pos/sales/${id}/void`, { managerPin }),

  exchangeSale: (
    id: string,
    input: {
      returns: RefundSaleItem[];
      replacements: SaleItemInput[];
      payments?: SalePaymentInput[];
      reason?: string;
      managerPin?: string;
    },
  ) => apiSend("post", `/pos/sales/${id}/exchange`, input),

  lookupBarcode: async (barcode: string): Promise<Product> =>
    mapProduct(await apiGet<ApiProduct>(`/pos/lookup/barcode/${encodeURIComponent(barcode)}`)),

  listDiscountRules: () => apiGet<PosDiscountRule[]>("/pos/discount-rules"),
  createDiscountRule: (input: { name: string; type: "PERCENTAGE" | "FIXED"; value: number }) =>
    apiSend<PosDiscountRule>("post", "/pos/discount-rules", input),

  setManagerPin: (pin: string, currentPin?: string) =>
    apiSend("post", "/pos/manager-pin", { pin, currentPin }),
};
