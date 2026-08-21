import { newId, nextSequence } from "@/lib/format";
import { round2 } from "../types";
import type { NewRetainerInput, RecordUsageInput, Retainer, RetainerStatus } from "../types";
import { seedRetainers, seedRetainerSeq } from "../mock/seed-retainers";
import { invoiceApi } from "./invoices.service";

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
      remainingBalance: input.contractAmount,
      currency: input.currency ?? "AED",
      status: "active",
      startDate: input.startDate,
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
            currency: input.currency ?? r.currency,
            startDate: input.startDate,
            notes: input.notes || undefined,
          }
        : r
    );
  },

  /** Manual usage log — for consumption you're tracking but not (yet, or
   *  ever) billing as its own invoice. Deducts the balance and logs an
   *  entry; auto-closes the retainer once exhausted. */
  recordUsage: async (id: string, input: RecordUsageInput): Promise<void> => {
    await delay();
    retainers = retainers.map((r) => {
      if (r.id !== id) return r;
      const remainingBalance = Math.max(0, round2(r.remainingBalance - input.amount));
      return {
        ...r,
        remainingBalance,
        status: remainingBalance === 0 ? "closed" : r.status,
        usage: [...r.usage, { id: newId("use"), date: input.date, amount: input.amount, note: input.note }],
      };
    });
  },

  /** The real invoice-linked counterpart to `recordUsage` — draws `invoice
   *  .total` from the retainer to cover a specific Invoice: deducts the
   *  balance, logs a usage entry referencing it, and marks the invoice paid
   *  via a "retainer" payment. Re-validates the amount against the current
   *  balance rather than trusting the caller already checked. Returns
   *  `false` (no-op) if the retainer isn't active or the amount doesn't fit. */
  drawForInvoice: async (
    retainerId: string,
    invoice: { id: string; number: string; total: number; issueDate: string }
  ): Promise<boolean> => {
    await delay();
    const retainer = retainers.find((r) => r.id === retainerId);
    if (!retainer || retainer.status !== "active" || invoice.total <= 0 || invoice.total > retainer.remainingBalance) return false;

    const remainingBalance = Math.max(0, round2(retainer.remainingBalance - invoice.total));
    retainers = retainers.map((r) =>
      r.id === retainerId
        ? {
            ...r,
            remainingBalance,
            status: remainingBalance === 0 ? "closed" : r.status,
            usage: [...r.usage, { id: newId("use"), date: invoice.issueDate, amount: invoice.total, note: `Invoice ${invoice.number}` }],
          }
        : r
    );

    await invoiceApi.recordPayment(invoice.id, {
      date: invoice.issueDate,
      amount: invoice.total,
      method: "retainer",
      reference: retainer.number,
    });

    return true;
  },

  setStatus: async (id: string, status: RetainerStatus): Promise<void> => {
    await delay(150);
    retainers = retainers.map((r) => (r.id === id ? { ...r, status } : r));
  },
};
