import { newId, nextSequence } from "@/lib/format";
import type { Adjustment, AdjustmentKind, Invoice, NewAdjustmentInput } from "../types";
import { seedAdjustments, seedCreditNoteSeq, seedDebitNoteSeq } from "../mock/seed-adjustments";
import { invoiceApi } from "./invoices.service";

/** Simulated network latency for the mock API. */
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory mock "database" — module-scoped, resets on page reload. Same
// pattern as invoiceApi/proposalsApi: React Query is the reactivity layer.
let adjustments: Adjustment[] = seedAdjustments;
let creditNoteSeq: number = seedCreditNoteSeq;
let debitNoteSeq: number = seedDebitNoteSeq;

function prefix(kind: AdjustmentKind): string {
  return kind === "credit" ? "CN" : "DN";
}

function nextSeq(kind: AdjustmentKind): number {
  return kind === "credit" ? creditNoteSeq : debitNoteSeq;
}

export const adjustmentsApi = {
  list: async (): Promise<Adjustment[]> => {
    await delay(200);
    return adjustments;
  },

  get: async (id: string): Promise<Adjustment | undefined> => {
    await delay(150);
    return adjustments.find((a) => a.id === id);
  },

  /** The next auto-assigned number for a kind, e.g. "CN-0003". */
  getNextNumber: async (kind: AdjustmentKind): Promise<string> => {
    await delay(120);
    return `${prefix(kind)}-${nextSequence(nextSeq(kind))}`;
  },

  /** Notes are recorded and issued in one step — there's no draft stage,
   *  it's a record of something that already happened (a refund, a
   *  correction), not a document to be sent and awaited. */
  create: async (input: NewAdjustmentInput): Promise<Adjustment> => {
    await delay();
    const number = `${prefix(input.kind)}-${nextSequence(nextSeq(input.kind))}`;
    const adjustment: Adjustment = {
      id: newId("adj"),
      number,
      kind: input.kind,
      customerId: input.customerId,
      invoiceId: input.invoiceId || undefined,
      amount: input.amount,
      reason: input.reason,
      currency: input.currency ?? "AED",
      status: "issued",
      createdBy: "Salma H.",
      createdAt: new Date().toISOString(),
    };
    adjustments = [adjustment, ...adjustments];
    if (input.kind === "credit") creditNoteSeq += 1;
    else debitNoteSeq += 1;
    return adjustment;
  },

  void: async (id: string): Promise<void> => {
    await delay();
    adjustments = adjustments.map((a) =>
      a.id === id && a.status === "issued" ? { ...a, status: "void", voidedAt: new Date().toISOString() } : a
    );
  },

  /** A standalone note (no linked invoice) has no document behind it that
   *  reflects in the books — this creates a draft Invoice for the note's
   *  amount and retroactively links the note to it: positive-value for a
   *  Debit Note (something new to collect from the customer), negative-
   *  value for a Credit Note (money owed back to the customer), so the
   *  balance-sheet effect shows up as an invoice either way. */
  convertToInvoice: async (id: string): Promise<Invoice | null> => {
    await delay();
    const adjustment = adjustments.find((a) => a.id === id);
    if (!adjustment || adjustment.invoiceId || adjustment.status !== "issued") return null;

    const issueDate = new Date().toISOString().slice(0, 10);
    const due = new Date();
    due.setDate(due.getDate() + 15);
    const signedAmount = adjustment.kind === "credit" ? -adjustment.amount : adjustment.amount;
    const label = adjustment.kind === "credit" ? "credit note" : "debit note";

    const invoice = await invoiceApi.create(
      {
        customerId: adjustment.customerId,
        issueDate,
        dueDate: due.toISOString().slice(0, 10),
        currency: adjustment.currency,
        lines: [{ description: `${adjustment.number} — ${adjustment.reason}`, quantity: 1, unitPrice: signedAmount, taxRate: 0 }],
        notes: `Generated from ${label} ${adjustment.number}`,
      },
      "draft",
      adjustment.kind === "credit" ? "credit-note" : "debit-note"
    );

    adjustments = adjustments.map((a) => (a.id === id ? { ...a, invoiceId: invoice.id } : a));

    return invoice;
  },
};
