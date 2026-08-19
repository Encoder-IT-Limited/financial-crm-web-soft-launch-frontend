/* ------------------------------------------------------------------ */
/* Sales / Invoicing — domain model. Frontend-only mock of the schema  */
/* in docs/inv-pos-hr-tenant.md §33.14 (invoices + invoice_items).     */
/* Timestamps are ISO strings so the Zustand store persists to         */
/* localStorage without a serializer.                                  */
/* ------------------------------------------------------------------ */

export type InvoiceStatus = "draft" | "sent" | "partially-paid" | "paid" | "cancelled";

/** Derived from status + payment state + due date — never stored.
 * `overdue` applies to sent/partially-paid invoices past their due date
 * with a balance remaining. */
export type InvoiceDisplayStatus = InvoiceStatus | "overdue";

export type Currency = "AED" | "USD" | "EUR" | "GBP" | "SAR";

export const CURRENCIES: Currency[] = ["AED", "USD", "EUR", "GBP", "SAR"];

export type PaymentMethod = "bank-transfer" | "card" | "cash" | "cheque" | "mobile-payment";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  "bank-transfer": "Bank Transfer",
  card: "Card",
  cash: "Cash",
  cheque: "Cheque",
  "mobile-payment": "Mobile Payment",
};

export type InvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // VAT %, 0 or 5 in UAE
  total: number; // quantity * unitPrice
};

export type Payment = {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
};

export type Invoice = {
  id: string;
  number: string; // INV-0045 — distinct sequence from POS receipts (POS-000001)
  customerId: string;
  issueDate: string;
  dueDate: string;
  currency: Currency;
  lines: InvoiceLine[];
  subtotal: number;
  discountPercent?: number; // invoice-level discount applied to subtotal before VAT
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  status: InvoiceStatus;
  notes?: string;
  createdBy: string;
  createdAt: string;
  sentAt?: string;
  lastReminderAt?: string;
  cancelledAt?: string;
  payments: Payment[];
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  trn: string; // UAE VAT registration number
  currency: Currency;
};

export type OrgProfile = {
  legalName: string;
  email: string;
  address: string;
  trn: string;
  bank: string;
  iban: string;
  accountName: string;
};

export type NewInvoiceInput = {
  customerId: string;
  issueDate: string;
  dueDate: string;
  currency?: Currency;
  discountPercent?: number;
  lines: { description: string; quantity: number; unitPrice: number; taxRate: number }[];
  notes?: string;
};

export type RecordPaymentInput = {
  date: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
};

export type InvoiceTotals = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
};

export function computeTotals(
  lines: { quantity: number; unitPrice: number; taxRate: number }[],
  discountPercent = 0
): InvoiceTotals {
  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const discount = (subtotal * discountPercent) / 100;
  const net = subtotal - discount;
  const tax = lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice * l.taxRate) / 100, 0);
  return {
    subtotal: round2(subtotal),
    discount: round2(discount),
    tax: round2(tax),
    total: round2(net + tax),
  };
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function invoiceBalance(invoice: Invoice): number {
  return round2(invoice.total - invoice.paidAmount);
}

/** The status shown in lists/badges — overdue is derived from dates. */
export function invoiceDisplayStatus(invoice: Invoice): InvoiceDisplayStatus {
  if (invoice.status === "sent" || invoice.status === "partially-paid") {
    if (invoiceBalance(invoice) > 0 && daysPast(invoice.dueDate) > 0) return "overdue";
  }
  return invoice.status;
}

export function daysPast(iso: string): number {
  const due = new Date(iso).getTime();
  if (Number.isNaN(due)) return 0;
  return Math.floor((Date.now() - due) / 86_400_000);
}

export function isInvoiceOverdue(invoice: Invoice): boolean {
  return invoiceDisplayStatus(invoice) === "overdue";
}