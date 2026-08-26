import { apiGet, apiGetPage, apiSend } from "@/lib/api/envelope";
import { authService } from "@/lib/auth/auth.service";
import { asCurrency } from "../../crm/types";
import type {
  FulfillInvoiceInput,
  Fulfillment,
  FulfillmentLine,
  FulfillmentLineStatus,
  FulfillmentTrigger,
  Invoice,
  InvoiceLine,
  InvoiceSource,
  InvoiceStatus,
  NewInvoiceInput,
  OrgProfile,
  Payment,
  PaymentMethod,
  RecordPaymentInput,
} from "../types";
import { computeTotals, round2 } from "../types";

type ApiInvoiceItem = {
  id: string;
  productId: string | null;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;
};

type ApiPayment = {
  id: string;
  amount: number | string;
  paymentMethod: string;
  transactionReference?: string | null;
  paymentDate: string;
};

type ApiFulfillmentLine = {
  id: string;
  invoiceItemId: string;
  productId: string;
  warehouseId: string;
  quantity: number | string;
  status: string;
};

type ApiFulfillment = {
  id: string;
  invoiceId: string;
  trigger: string;
  deliveryNoteNumber?: string | null;
  notes?: string | null;
  fulfilledAt: string;
  fulfilledBy: string;
  lines?: ApiFulfillmentLine[];
};

type ApiInvoice = {
  id: string;
  customerId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;
  paidAmount: number | string;
  balanceDue: number | string;
  status: string;
  source?: string;
  currency?: string | null;
  createdAt: string;
  sentAt?: string | null;
  lastReminderAt?: string | null;
  fulfilledAt?: string | null;
  items?: ApiInvoiceItem[];
  payments?: ApiPayment[];
  fulfillments?: ApiFulfillment[];
  overdue?: boolean;
};

const STATUS_MAP: Record<string, InvoiceStatus> = {
  DRAFT: "draft",
  SENT: "sent",
  PARTIALLY_PAID: "partially-paid",
  PAID: "paid",
  CANCELLED: "cancelled",
};

const SOURCE_FROM_API: Record<string, InvoiceSource> = {
  MANUAL: "manual",
  ESTIMATE: "estimate",
  RECURRING: "recurring",
  POS: "pos",
  DEBIT_NOTE: "debit-note",
  CREDIT_NOTE: "credit-note",
  RETAINER: "retainer",
  RETAINER_TOPUP: "retainer-topup",
};

const TRIGGER_FROM_API: Record<string, FulfillmentTrigger> = {
  MANUAL: "manual",
  DELIVERY_NOTE: "delivery-note",
  POS_AUTO: "pos-auto",
};

const LINE_STATUS_FROM_API: Record<string, FulfillmentLineStatus> = {
  FULFILLED: "fulfilled",
  PENDING_RECONCILIATION: "pending-reconciliation",
};

const METHOD_TO_API: Record<string, string> = {
  cash: "CASH",
  card: "CARD",
  "bank-transfer": "BANK",
  "mobile-payment": "MOBILE_PAYMENT",
  cheque: "CHEQUE",
  retainer: "OTHER",
};

const METHOD_FROM_API: Record<string, PaymentMethod> = {
  CASH: "cash",
  CARD: "card",
  BANK: "bank-transfer",
  MOBILE_PAYMENT: "mobile-payment",
  CHEQUE: "cheque",
  OTHER: "cash",
};

function mapSource(value: string | undefined): InvoiceSource {
  if (!value) return "manual";
  return SOURCE_FROM_API[value] ?? "manual";
}

function mapFulfillmentLine(row: ApiFulfillmentLine): FulfillmentLine {
  return {
    id: row.id,
    invoiceLineId: row.invoiceItemId,
    productId: row.productId,
    warehouseId: row.warehouseId,
    quantityFulfilled: Number(row.quantity),
    status: LINE_STATUS_FROM_API[row.status] ?? "fulfilled",
  };
}

export function mapFulfillment(row: ApiFulfillment): Fulfillment {
  return {
    id: row.id,
    invoiceId: row.invoiceId,
    trigger: TRIGGER_FROM_API[row.trigger] ?? "manual",
    deliveryNoteNumber: row.deliveryNoteNumber ?? undefined,
    notes: row.notes ?? undefined,
    fulfilledAt: row.fulfilledAt,
    fulfilledBy: row.fulfilledBy,
    lines: (row.lines ?? []).map(mapFulfillmentLine),
  };
}

function mapLines(items: ApiInvoiceItem[] | undefined): InvoiceLine[] {
  if (!items?.length) return [];
  return items.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const taxAmount = Number(item.tax);
    const lineSub = quantity * unitPrice;
    const taxRate = lineSub > 0 ? round2((taxAmount / lineSub) * 100) : 0;
    return {
      id: item.id,
      description: item.description,
      quantity,
      unitPrice,
      taxRate,
      total: Number(item.total),
      productId: item.productId ?? undefined,
    };
  });
}

function mapPayments(rows: ApiPayment[] | undefined): Payment[] {
  if (!rows?.length) return [];
  return rows.map((p) => ({
    id: p.id,
    date: String(p.paymentDate).slice(0, 10),
    amount: Number(p.amount),
    method: METHOD_FROM_API[p.paymentMethod] ?? "cash",
    reference: p.transactionReference ?? undefined,
  }));
}

function mapInvoice(row: ApiInvoice): Invoice {
  const status = STATUS_MAP[row.status] ?? "draft";
  const subtotal = Number(row.subtotal);
  const discount = Number(row.discount);
  const discountPercent = subtotal > 0 && discount > 0 ? round2((discount / subtotal) * 100) : undefined;
  return {
    id: row.id,
    number: row.invoiceNumber,
    customerId: row.customerId,
    issueDate: String(row.invoiceDate).slice(0, 10),
    dueDate: String(row.dueDate).slice(0, 10),
    currency: asCurrency(row.currency),
    lines: mapLines(row.items),
    subtotal,
    discountPercent,
    discount,
    tax: Number(row.tax),
    total: Number(row.total),
    paidAmount: Number(row.paidAmount),
    status,
    source: mapSource(row.source),
    createdBy: "—",
    createdAt: row.createdAt,
    sentAt: row.sentAt ? String(row.sentAt) : status === "draft" ? undefined : row.createdAt,
    lastReminderAt: row.lastReminderAt ? String(row.lastReminderAt) : undefined,
    cancelledAt: status === "cancelled" ? row.createdAt : undefined,
    fulfilledAt: row.fulfilledAt ? String(row.fulfilledAt) : undefined,
    payments: mapPayments(row.payments),
    fulfillments: row.fulfillments?.map(mapFulfillment),
  };
}

function toApiItems(input: NewInvoiceInput) {
  return input.lines.map((line) => {
    const lineSub = line.quantity * line.unitPrice;
    const tax = round2(lineSub * (line.taxRate / 100));
    return {
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discount: 0,
      tax,
      productId: line.productId,
    };
  });
}

/**
 * Live invoicing API.
 */
export const invoiceApi = {
  list: async (): Promise<Invoice[]> => {
    const page = await apiGetPage<ApiInvoice>("/invoices");
    return page.items.map(mapInvoice);
  },

  listPage: async (params?: { page?: number; pageSize?: number }) => {
    const page = await apiGetPage<ApiInvoice>("/invoices", params);
    return { ...page, items: page.items.map(mapInvoice) };
  },

  get: async (id: string): Promise<Invoice | undefined> => {
    try {
      return mapInvoice(await apiGet<ApiInvoice>(`/invoices/${id}`));
    } catch {
      return undefined;
    }
  },

  getNextNumber: async (): Promise<string> => {
    const row = await apiGet<{ number: string }>("/invoices/next-number");
    return row.number;
  },

  getOrgProfile: async (): Promise<OrgProfile> => {
    const me = await authService.me();
    const tenant = me.tenant;
    return {
      legalName: tenant?.legalName || tenant?.name || "Your company",
      email: tenant?.email || me.email,
      address: tenant?.address || "",
      trn: tenant?.taxNumber || "",
      bank: "",
      iban: "",
      accountName: tenant?.legalName || tenant?.name || "",
    };
  },

  create: async (
    input: NewInvoiceInput,
    mode: "draft" | "send",
    _source: InvoiceSource = "manual",
  ): Promise<Invoice> => {
    const created = await apiSend<ApiInvoice>("post", "/invoices", {
      customerId: input.customerId,
      dueDate: input.dueDate,
      currency: input.currency,
      items: toApiItems(input),
    });
    if (mode === "send") {
      await apiSend("post", `/invoices/${created.id}/send`);
      return mapInvoice(await apiGet<ApiInvoice>(`/invoices/${created.id}`));
    }
    return mapInvoice(await apiGet<ApiInvoice>(`/invoices/${created.id}`));
  },

  update: async (id: string, input: NewInvoiceInput): Promise<Invoice> => {
    await apiSend<ApiInvoice>("patch", `/invoices/${id}`, {
      customerId: input.customerId,
      dueDate: input.dueDate,
      items: toApiItems(input),
    });
    return mapInvoice(await apiGet<ApiInvoice>(`/invoices/${id}`));
  },

  send: async (id: string): Promise<void> => {
    await apiSend("post", `/invoices/${id}/send`);
  },

  recordPayment: async (id: string, input: RecordPaymentInput): Promise<void> => {
    await apiSend("post", `/invoices/${id}/payments`, {
      amount: input.amount,
      paymentMethod: METHOD_TO_API[input.method] ?? "OTHER",
      transactionReference: input.reference,
    });
  },

  fulfill: async (
    id: string,
    input: FulfillInvoiceInput,
  ): Promise<{ invoice: Invoice; fulfillment: Fulfillment }> => {
    const result = await apiSend<{ invoice: ApiInvoice; fulfillment: ApiFulfillment }>(
      "post",
      `/invoices/${id}/fulfill`,
      {
        warehouseId: input.warehouseId,
        lines: input.lines,
        generateDeliveryNote: input.generateDeliveryNote,
        notes: input.notes,
        trigger: input.generateDeliveryNote ? "DELIVERY_NOTE" : "MANUAL",
      },
    );
    return { invoice: mapInvoice(result.invoice), fulfillment: mapFulfillment(result.fulfillment) };
  },

  listFulfillments: async (invoiceId?: string): Promise<Fulfillment[]> => {
    const query = invoiceId ? `?invoiceId=${encodeURIComponent(invoiceId)}` : "";
    const rows = await apiGet<ApiFulfillment[]>(`/fulfillments${query}`);
    return rows.map(mapFulfillment);
  },

  listPendingReconciliation: async (): Promise<(FulfillmentLine & { invoiceId: string })[]> => {
    const rows = await apiGet<
      (ApiFulfillmentLine & { fulfillment: ApiFulfillment; invoiceItemId: string })[]
    >("/fulfillments/pending-reconciliation");
    return rows.map((row) => ({
      ...mapFulfillmentLine({
        id: row.id,
        invoiceItemId: row.invoiceItemId,
        productId: row.productId,
        warehouseId: row.warehouseId,
        quantity: row.quantity,
        status: row.status,
      }),
      invoiceId: row.fulfillment.invoiceId,
    }));
  },

  reconcileFulfillmentLine: async (lineId: string): Promise<void> => {
    await apiSend("post", `/fulfillments/lines/${lineId}/reconcile`);
  },

  cancel: async (id: string): Promise<void> => {
    await apiSend("post", `/invoices/${id}/cancel`);
  },

  sendReminder: async (id: string): Promise<void> => {
    await apiSend("post", `/invoices/${id}/reminders`);
  },

  previewTotals: (input: NewInvoiceInput) => computeTotals(input.lines, input.discountPercent ?? 0),
};

export type { PaymentMethod };
