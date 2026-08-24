import { newId, nextSequence } from "@/lib/format";
import { round2 } from "../types";
import type { NewRetainerInput, Retainer, RetainerStatus } from "../types";
import { seedRetainers, seedRetainerSeq } from "../mock/seed-retainers";
import { invoiceApi } from "./invoices.service";
import { adjustmentsApi } from "./adjustments.service";

/** Simulated network latency for the mock API. */
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory mock "database" — module-scoped, resets on page reload. Same
// pattern as invoiceApi/proposalsApi/adjustmentsApi: React Query is the
// reactivity layer.
let retainers: Retainer[] = seedRetainers;
let retainerSeq: number = seedRetainerSeq;

export const retainersApi = {
  list: async (): Promise<Retainer[]> => {
    await delay(200);
    return retainers;
  },

  get: async (id: string): Promise<Retainer | undefined> => {
    await delay(150);
    return retainers.find((r) => r.id === id);
  },

  /** Also generates and pays a funding invoice for the contract amount —
   *  the document behind the customer's upfront payment. Every dollar in
   *  this module has an invoice/payment behind it; retainers aren't an
   *  exception (same reasoning as the credit/debit note conversion). */
  create: async (input: NewRetainerInput): Promise<Retainer> => {
    await delay();
    const number = `RET-${nextSequence(retainerSeq)}`;
    const today = new Date().toISOString().slice(0, 10);

    const fundingInvoice = await invoiceApi.create(
      {
        customerId: input.customerId,
        issueDate: today,
        dueDate: today,
        currency: input.currency ?? "AED",
        lines: [
          {
            description: `Retainer contract ${number} — ${input.billingPeriod} retainer funding`,
            quantity: 1,
            unitPrice: input.contractAmount,
            taxRate: 0,
          },
        ],
        notes: `Upfront funding for retainer ${number}`,
      },
      "send",
      "retainer"
    );
    await invoiceApi.recordPayment(fundingInvoice.id, {
      date: today,
      amount: input.contractAmount,
      method: "bank-transfer",
      reference: number,
    });

    const retainer: Retainer = {
      id: newId("ret"),
      number,
      customerId: input.customerId,
      contractAmount: input.contractAmount,
      billingPeriod: input.billingPeriod,
      billingModel: input.billingModel ?? "one-time",
      remainingBalance: input.contractAmount,
      currency: input.currency ?? "AED",
      status: "active",
      startDate: input.startDate,
      expiryDate: input.expiryDate || undefined,
      notes: input.notes || undefined,
      createdBy: "Salma H.",
      createdAt: new Date().toISOString(),
      usage: [],
      fundingInvoiceId: fundingInvoice.id,
    };
    retainers = [retainer, ...retainers];
    retainerSeq += 1;
    return retainer;
  },

  update: async (id: string, input: NewRetainerInput): Promise<void> => {
    await delay();
    retainers = retainers.map((r) =>
      r.id === id
        ? {
            ...r,
            customerId: input.customerId,
            contractAmount: input.contractAmount,
            billingPeriod: input.billingPeriod,
            billingModel: input.billingModel ?? r.billingModel,
            currency: input.currency ?? r.currency,
            startDate: input.startDate,
            expiryDate: input.expiryDate || undefined,
            notes: input.notes || undefined,
          }
        : r
    );
  },

  /** Draws from the retainer to cover a specific Invoice: deducts the
   *  balance, logs a usage entry referencing it, and marks the invoice paid
   *  (fully or partially) via a "retainer" payment.
   *
   *  Split/partial coverage (Sales-Invoicing-Implementation-Plan.md Key
   *  Decision #8): if the invoice total exceeds what's left, the draw pays
   *  what it can — `Math.min(invoice.total, remainingBalance)` — and
   *  `invoiceApi.recordPayment` already turns that into a `"partially-paid"`
   *  invoice the normal way; the rest is owed like any other partial
   *  payment. No new invoice status or split-payment concept needed.
   *
   *  Overdraw stays a permanent hard cap (Key Decision #10) — this never
   *  draws more than `remainingBalance`, no override path exists.
   *
   *  Re-validates against the current balance rather than trusting the
   *  caller already checked. Returns `false` (no-op) if the retainer isn't
   *  active or there's nothing left to draw. */
  drawForInvoice: async (
    retainerId: string,
    invoice: { id: string; number: string; total: number; issueDate: string }
  ): Promise<boolean> => {
    await delay();
    const retainer = retainers.find((r) => r.id === retainerId);
    if (!retainer || retainer.status !== "active" || invoice.total <= 0 || retainer.remainingBalance <= 0) return false;

    const drawAmount = round2(Math.min(invoice.total, retainer.remainingBalance));
    const remainingBalance = Math.max(0, round2(retainer.remainingBalance - drawAmount));
    retainers = retainers.map((r) =>
      r.id === retainerId
        ? {
            ...r,
            remainingBalance,
            status: remainingBalance === 0 ? "closed" : r.status,
            usage: [...r.usage, { id: newId("use"), date: invoice.issueDate, amount: drawAmount, note: `Invoice ${invoice.number}` }],
          }
        : r
    );

    await invoiceApi.recordPayment(invoice.id, {
      date: invoice.issueDate,
      amount: drawAmount,
      method: "retainer",
      reference: retainer.number,
    });

    return true;
  },

  /** Recurring top-up (Phase H2) — adds to the balance, never resets it
   *  (Key Decision #14: unused balance rolls over every cycle). Called by
   *  `recurringApi.generate()` for a "retainer-topup" template; the Paid
   *  funding invoice itself is created there, this only moves the number. */
  topUp: async (id: string, amount: number): Promise<void> => {
    await delay(150);
    retainers = retainers.map((r) => (r.id === id ? { ...r, remainingBalance: round2(r.remainingBalance + amount) } : r));
  },

  setStatus: async (id: string, status: RetainerStatus): Promise<void> => {
    await delay(150);
    retainers = retainers.map((r) => (r.id === id ? { ...r, status } : r));
  },

  /** Self-serve disposition (Phase H3) — moves the full remaining balance
   *  to another active retainer for the same customer, zeroes and closes
   *  the source. No approval gate; caller (UI) is responsible for only
   *  offering retainers belonging to the same customer. */
  transfer: async (fromId: string, toId: string): Promise<boolean> => {
    await delay();
    const from = retainers.find((r) => r.id === fromId);
    const to = retainers.find((r) => r.id === toId);
    if (!from || !to || from.id === to.id || from.status !== "active" || to.status !== "active") return false;

    const amount = from.remainingBalance;
    retainers = retainers.map((r) => {
      if (r.id === fromId) {
        return { ...r, remainingBalance: 0, status: "closed", dispositionReason: "transferred", transferredToRetainerId: toId };
      }
      if (r.id === toId) {
        return { ...r, remainingBalance: round2(r.remainingBalance + amount) };
      }
      return r;
    });
    return true;
  },

  /** Self-serve disposition (Phase H3) — closes this retainer and creates a
   *  new one for the same customer seeded with the leftover balance, linked
   *  both ways. No new funding invoice: the money isn't new, it already has
   *  a document behind it on the original contract (`fundingInvoiceId`,
   *  reachable via `rolledOverFromRetainerId`). No approval gate. */
  rollOver: async (id: string, newExpiryDate?: string): Promise<Retainer | null> => {
    await delay();
    const source = retainers.find((r) => r.id === id);
    if (!source || source.status !== "active") return null;

    const number = `RET-${nextSequence(retainerSeq)}`;
    const created: Retainer = {
      id: newId("ret"),
      number,
      customerId: source.customerId,
      contractAmount: source.remainingBalance,
      billingPeriod: source.billingPeriod,
      billingModel: source.billingModel,
      remainingBalance: source.remainingBalance,
      currency: source.currency,
      status: "active",
      startDate: new Date().toISOString().slice(0, 10),
      expiryDate: newExpiryDate || undefined,
      notes: source.notes,
      createdBy: "Salma H.",
      createdAt: new Date().toISOString(),
      usage: [],
      rolledOverFromRetainerId: source.id,
    };
    retainerSeq += 1;

    retainers = [
      created,
      ...retainers.map((r): Retainer =>
        r.id === id
          ? { ...r, remainingBalance: 0, status: "closed", dispositionReason: "rolled-over", rolledOverToRetainerId: created.id }
          : r
      ),
    ];
    return created;
  },

  /** Approval-gated disposition (Phase H3, Key Decision #9) — the balance
   *  is simply lost, no invoice. The `can(me, "retainer.approve")` check
   *  happens in the UI before this is ever called; this function trusts
   *  its caller, same as every other mutation in this service. */
  forfeit: async (id: string): Promise<void> => {
    await delay();
    retainers = retainers.map((r) => (r.id === id ? { ...r, remainingBalance: 0, status: "closed", dispositionReason: "forfeited" } : r));
  },

  /** Approval-gated disposition (Phase H3, Key Decision #6/#9) — reuses the
   *  Adjustments credit-note-to-invoice pattern rather than a parallel
   *  refund mechanism: issues a *standalone* credit Adjustment (no linked
   *  invoiceId — `convertToInvoice` only acts on standalone notes, by
   *  design; the funding invoice is referenced in the reason text instead),
   *  then converts it into a real negative-value invoice, so the refund
   *  leaves the same kind of document every other dollar in this module
   *  does. */
  requestRefund: async (id: string, reason: string): Promise<boolean> => {
    await delay();
    const retainer = retainers.find((r) => r.id === id);
    if (!retainer || retainer.status !== "active" || retainer.remainingBalance <= 0) return false;

    const adjustment = await adjustmentsApi.create({
      kind: "credit",
      customerId: retainer.customerId,
      amount: retainer.remainingBalance,
      reason: reason || `Refund of unused balance on ${retainer.number} (funded via ${retainer.fundingInvoiceId ?? "—"})`,
      currency: retainer.currency,
    });
    await adjustmentsApi.convertToInvoice(adjustment.id);

    retainers = retainers.map((r) =>
      r.id === id
        ? { ...r, remainingBalance: 0, status: "closed", dispositionReason: "refunded", refundAdjustmentId: adjustment.id }
        : r
    );
    return true;
  },
};
