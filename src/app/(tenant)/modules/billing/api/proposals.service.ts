import { newId, nextSequence } from "@/lib/format";
import type { Invoice, NewProposalInput, Proposal } from "../types";
import { computeTotals, round2 } from "../types";
import { seedProposals, seedProposalSeq } from "../mock/seed-proposals";
import { invoiceApi } from "./invoices.service";

/** Simulated network latency for the mock API. */
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory mock "database" — module-scoped, resets on page reload. Same
// pattern as invoiceApi/recurringApi: React Query is the reactivity layer.
let proposals: Proposal[] = seedProposals;
let proposalSeq: number = seedProposalSeq;

export const proposalsApi = {
  list: async (): Promise<Proposal[]> => {
    await delay(200);
    return proposals;
  },

  get: async (id: string): Promise<Proposal | undefined> => {
    await delay(150);
    return proposals.find((p) => p.id === id);
  },

  /** The next auto-assigned proposal number, e.g. "PRO-0005". */
  getNextNumber: async (): Promise<string> => {
    await delay(120);
    return `PRO-${nextSequence(proposalSeq)}`;
  },

  create: async (input: NewProposalInput, mode: "draft" | "send"): Promise<Proposal> => {
    await delay();
    const number = `PRO-${nextSequence(proposalSeq)}`;
    const totals = computeTotals(input.lines, input.discountPercent ?? 0);
    const proposal: Proposal = {
      id: newId("prop"),
      number,
      customerId: input.customerId,
      date: input.date,
      expiryDate: input.expiryDate,
      currency: input.currency ?? "AED",
      lines: input.lines.map((l) => ({ ...l, id: newId("ln"), total: round2(l.quantity * l.unitPrice) })),
      subtotal: totals.subtotal,
      discountPercent: input.discountPercent || undefined,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total,
      status: mode === "draft" ? "draft" : "sent",
      notes: input.notes || undefined,
      createdBy: "Salma H.",
      createdAt: new Date().toISOString(),
      sentAt: mode === "send" ? new Date().toISOString() : undefined,
    };
    proposals = [proposal, ...proposals];
    proposalSeq += 1;
    return proposal;
  },

  update: async (id: string, input: NewProposalInput): Promise<void> => {
    await delay();
    const totals = computeTotals(input.lines, input.discountPercent ?? 0);
    proposals = proposals.map((p) =>
      p.id === id
        ? {
            ...p,
            customerId: input.customerId,
            date: input.date,
            expiryDate: input.expiryDate,
            currency: input.currency ?? p.currency,
            lines: input.lines.map((l) => ({ ...l, id: newId("ln"), total: round2(l.quantity * l.unitPrice) })),
            subtotal: totals.subtotal,
            discountPercent: input.discountPercent || undefined,
            discount: totals.discount,
            tax: totals.tax,
            total: totals.total,
            notes: input.notes || undefined,
          }
        : p
    );
  },

  send: async (id: string): Promise<void> => {
    await delay();
    proposals = proposals.map((p) =>
      p.id === id && p.status === "draft" ? { ...p, status: "sent", sentAt: p.sentAt ?? new Date().toISOString() } : p
    );
  },

  reject: async (id: string): Promise<void> => {
    await delay();
    proposals = proposals.map((p) =>
      p.id === id ? { ...p, status: "rejected", respondedAt: new Date().toISOString() } : p
    );
  },

  /** Convert to a draft Invoice (source: "estimate"), prefilled from the
   *  proposal's lines. Marks the proposal accepted and links the invoice. */
  convertToInvoice: async (id: string): Promise<Invoice | null> => {
    await delay();
    const proposal = proposals.find((p) => p.id === id);
    if (!proposal || proposal.convertedInvoiceId) return null;

    const issueDate = new Date().toISOString().slice(0, 10);
    const due = new Date();
    due.setDate(due.getDate() + 15);

    const invoice = await invoiceApi.create(
      {
        customerId: proposal.customerId,
        issueDate,
        dueDate: due.toISOString().slice(0, 10),
        currency: proposal.currency,
        discountPercent: proposal.discountPercent,
        lines: proposal.lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
        })),
        notes: `Converted from proposal ${proposal.number}`,
      },
      "draft",
      "estimate"
    );

    proposals = proposals.map((p) =>
      p.id === id
        ? { ...p, status: "accepted", respondedAt: p.respondedAt ?? new Date().toISOString(), convertedInvoiceId: invoice.id }
        : p
    );

    return invoice;
  },
};
