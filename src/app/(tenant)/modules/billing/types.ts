/* ------------------------------------------------------------------ */
/* Sales / Invoicing — domain model. Frontend-only mock of the schema  */
/* in docs/inv-pos-hr-tenant.md §33.14 (invoices + invoice_items).     */
/* Timestamps are ISO strings; data lives in in-memory mock services   */
/* consumed via React Query.                                           */
/* ------------------------------------------------------------------ */

/** Re-exported from the CRM module — Customer & currency vocabulary are
 *  owned there so CRM/Sales/POS never duplicate them. */
import type { Currency } from "../crm/types";
export type { Currency, Customer } from "../crm/types";
export { CURRENCIES } from "../crm/types";
import { pct } from "@/lib/format";

export type InvoiceStatus = "draft" | "sent" | "partially-paid" | "paid" | "cancelled";

/** Where an invoice originated (docs/inv-pos-hr-tenant.md §19). `pos` is
 *  forward-compat for the future POS module; nothing sets it yet.
 *  `debit-note`/`credit-note` are set when a standalone note (one issued
 *  with no linked invoice) is converted into an invoice — positive-value
 *  for a debit note, negative-value for a credit note. `retainer` is set
 *  on the funding invoice auto-generated when a Retainer is created;
 *  `retainer-topup` on each subsequent recurring top-up invoice (Phase H2). */
export type InvoiceSource =
  | "manual"
  | "estimate"
  | "recurring"
  | "pos"
  | "debit-note"
  | "credit-note"
  | "retainer"
  | "retainer-topup";

/** Derived from status + payment state + due date — never stored.
 * `overdue` applies to sent/partially-paid invoices past their due date
 * with a balance remaining. */
export type InvoiceDisplayStatus = InvoiceStatus | "overdue";

/** `retainer` is set only by `retainersApi.drawForInvoice` — never
 *  selectable from RecordPaymentDialog, since a manually-recorded "retainer"
 *  payment there wouldn't actually deduct the retainer's balance. */
export type PaymentMethod = "bank-transfer" | "card" | "cash" | "cheque" | "mobile-payment" | "retainer";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  "bank-transfer": "Bank Transfer",
  card: "Card",
  cash: "Cash",
  cheque: "Cheque",
  "mobile-payment": "Mobile Payment",
  retainer: "Retainer Draw",
};

export type InvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // VAT %, 0 or 5 in UAE
  total: number; // quantity * unitPrice
  /** Forward-compat for the Inventory module (docs §2) — unused today. */
  productId?: string;
  warehouseId?: string;
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
  source: InvoiceSource;
  notes?: string;
  createdBy: string;
  createdAt: string;
  sentAt?: string;
  lastReminderAt?: string;
  cancelledAt?: string;
  payments: Payment[];
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

/* ------------------------------------------------------------------ */
/* Proposals — merged with "Estimates" (same concept, richer status    */
/* set) per the Sales & Invoicing plan's Key Decision #3.              */
/* ------------------------------------------------------------------ */

export type ProposalStatus = "draft" | "sent" | "accepted" | "rejected";

/** Derived from status + expiry date — never stored. `expired` applies to
 *  a `sent` proposal whose expiry date has passed without a response. */
export type ProposalDisplayStatus = ProposalStatus | "expired";

export type Proposal = {
  id: string;
  number: string; // PRO-0001
  customerId: string;
  date: string;
  expiryDate: string;
  currency: Currency;
  lines: InvoiceLine[];
  subtotal: number;
  discountPercent?: number;
  discount: number;
  tax: number;
  total: number;
  status: ProposalStatus;
  notes?: string;
  createdBy: string;
  createdAt: string;
  sentAt?: string;
  respondedAt?: string;
  /** Set once "Convert to Invoice" has run — links to the created invoice. */
  convertedInvoiceId?: string;
};

export type NewProposalInput = {
  customerId: string;
  date: string;
  expiryDate: string;
  currency?: Currency;
  discountPercent?: number;
  lines: { description: string; quantity: number; unitPrice: number; taxRate: number }[];
  notes?: string;
};

export function proposalDisplayStatus(proposal: Proposal): ProposalDisplayStatus {
  if (proposal.status === "sent" && daysPast(proposal.expiryDate) > 0) return "expired";
  return proposal.status;
}

/* ------------------------------------------------------------------ */
/* Credit & Debit Notes — one combined "adjustment" model, matching    */
/* the plan's decision to keep a single route/nav item with a Credit/  */
/* Debit tab switch rather than two separate entities.                 */
/* docs/inv-pos-hr-tenant.md §33.16 only specs `credit_notes`; debit    */
/* notes mirror the same shape with the balance effect inverted.       */
/* ------------------------------------------------------------------ */

export type AdjustmentKind = "credit" | "debit";

export type AdjustmentStatus = "issued" | "void";

export type Adjustment = {
  id: string;
  number: string; // CN-0001 / DN-0001
  kind: AdjustmentKind;
  customerId: string;
  invoiceId?: string;
  amount: number;
  reason: string;
  currency: Currency;
  status: AdjustmentStatus;
  createdBy: string;
  createdAt: string;
  voidedAt?: string;
};

export type NewAdjustmentInput = {
  kind: AdjustmentKind;
  customerId: string;
  invoiceId?: string;
  amount: number;
  reason: string;
  currency?: Currency;
};

/** Issued adjustments linked to a given invoice — voided ones don't count. */
export function adjustmentsForInvoice(adjustments: Adjustment[], invoiceId: string): Adjustment[] {
  return adjustments.filter((a) => a.invoiceId === invoiceId && a.status === "issued");
}

/** Invoice balance after applying its linked credit/debit notes — credits
 *  reduce what's owed, debits increase it. Never stored on the invoice
 *  itself; always derived so a voided note instantly stops affecting it. */
export function adjustedInvoiceBalance(invoice: Invoice, invoiceAdjustments: Adjustment[]): number {
  const net = invoiceAdjustments.reduce((sum, a) => sum + (a.kind === "credit" ? -a.amount : a.amount), 0);
  return round2(invoiceBalance(invoice) + net);
}

/* ------------------------------------------------------------------ */
/* Retainers — CRUD + balance tracking, plus Phase H's recurring        */
/* top-ups, expiry disposition (Transfer/Roll Over/Forfeit/Refund), and */
/* draws that generate real invoices (see docs/Sales-Invoicing-         */
/* Implementation-Plan.md Phase H and its Key Decisions #6-14).         */
/* ------------------------------------------------------------------ */

export type RetainerBillingPeriod = "monthly" | "quarterly" | "yearly";

export type RetainerStatus = "active" | "paused" | "closed";

/** Derived from status + expiryDate — never stored. Same never-stored
 *  pattern as invoiceDisplayStatus()/proposalDisplayStatus(). */
export type RetainerDisplayStatus = RetainerStatus | "expired";

/** Set on a closed retainer to record *why* it closed — distinguishes a
 *  plain balance-exhausted close from an expiry disposition. */
export type RetainerDispositionReason = "forfeited" | "refunded" | "transferred" | "rolled-over";

export type RetainerUsage = {
  id: string;
  date: string;
  amount: number;
  note?: string;
};

export type Retainer = {
  id: string;
  number: string; // RET-0001
  customerId: string;
  contractAmount: number;
  billingPeriod: RetainerBillingPeriod;
  /** One-time lump sum vs. recurring subscription that tops the balance
   *  back up each cycle (client Q&A section C — "both" are supported). */
  billingModel: "one-time" | "recurring";
  remainingBalance: number;
  currency: Currency;
  status: RetainerStatus;
  startDate: string;
  /** Contract end date (client Q&A section D — confirmed every retainer has
   *  one). Optional only because retainers seeded/created before Phase H
   *  don't have it. */
  expiryDate?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  usage: RetainerUsage[];
  /** Invoice auto-generated (and marked paid) for the contract amount when
   *  the retainer was created — the document behind the upfront funding.
   *  Absent on retainers seeded before this existed, and on a retainer
   *  created via Roll Over (the funding already happened on the original
   *  contract — see rolledOverFromRetainerId). */
  fundingInvoiceId?: string;
  /** Why this retainer is closed (Phase H disposition actions). Absent for
   *  a plain balance-exhausted close. */
  dispositionReason?: RetainerDispositionReason;
  /** Set on the *source* retainer of a Transfer, pointing at the
   *  destination retainer that received the balance. */
  transferredToRetainerId?: string;
  /** Set on the *new* retainer created by a Roll Over, pointing back at the
   *  contract it carried the balance over from. */
  rolledOverFromRetainerId?: string;
  /** Set on the *old* retainer once rolled over, pointing at the new one. */
  rolledOverToRetainerId?: string;
  /** The credit-note Adjustment issued for a Refund disposition, once
   *  converted to a real (negative-value) invoice — see requestRefund(). */
  refundAdjustmentId?: string;
};

export type NewRetainerInput = {
  customerId: string;
  contractAmount: number;
  billingPeriod: RetainerBillingPeriod;
  billingModel?: "one-time" | "recurring";
  currency?: Currency;
  startDate: string;
  expiryDate?: string;
  notes?: string;
};

export function retainerUsedAmount(retainer: Retainer): number {
  return round2(retainer.contractAmount - retainer.remainingBalance);
}

export function retainerPercentUsed(retainer: Retainer): number {
  return pct(retainerUsedAmount(retainer), retainer.contractAmount);
}

/** The status shown in lists/badges — expired is derived from `expiryDate`,
 *  never stored, so it always reflects "today" without a background job. */
export function retainerDisplayStatus(retainer: Retainer): RetainerDisplayStatus {
  if (retainer.status === "active" && retainer.expiryDate && daysPast(retainer.expiryDate) > 0) return "expired";
  return retainer.status;
}