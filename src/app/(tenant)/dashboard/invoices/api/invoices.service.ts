import { newId, nextSequence } from "@/lib/format";
import type {
  Invoice,
  InvoiceSource,
  NewInvoiceInput,
  OrgProfile,
  PaymentMethod,
  RecordPaymentInput,
} from "../types";
import { computeTotals, round2 } from "../types";
import { seedInvoiceSeq, seedInvoices, seedOrgProfile } from "../mock/seed";

/** Simulated network latency for the mock API. */
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory mock "database" — module-scoped, resets on page reload. Replaces
// the old Zustand store; React Query (useQuery/invalidateQueries) is now the
// reactivity layer, this is just the data these functions read/write.
let invoices: Invoice[] = seedInvoices;
let invoiceSeq: number = seedInvoiceSeq;
const orgProfile: OrgProfile = seedOrgProfile;

/**
 * Mock API service layer for invoicing. Every function returns a Promise so
 * the UI consumes it exactly like the real REST API (apiGet/apiSend pattern
 * in Basic-Setup.md §6) — swap the bodies for real calls later without
 * touching any component. Customers live in the CRM module's service.
 */
export const invoiceApi = {
  list: async (): Promise<Invoice[]> => {
    await delay(250);
    return invoices;
  },

  get: async (id: string): Promise<Invoice | undefined> => {
    await delay(200);
    return invoices.find((inv) => inv.id === id);
  },

  /** The next auto-assigned invoice number, e.g. "INV-0045". */
  getNextNumber: async (): Promise<string> => {
    await delay(150);
    return `INV-${nextSequence(invoiceSeq)}`;
  },

  getOrgProfile: async (): Promise<OrgProfile> => {
    await delay(100);
    return orgProfile;
  },

  create: async (input: NewInvoiceInput, mode: "draft" | "send", source: InvoiceSource = "manual"): Promise<Invoice> => {
    await delay();
    const number = `INV-${nextSequence(invoiceSeq)}`;
    const totals = computeTotals(input.lines, input.discountPercent ?? 0);
    const invoice: Invoice = {
      id: newId("inv"),
      number,
      customerId: input.customerId,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      currency: input.currency ?? "AED",
      lines: input.lines.map((l) => ({ ...l, id: newId("ln"), total: round2(l.quantity * l.unitPrice) })),
      subtotal: totals.subtotal,
      discountPercent: input.discountPercent || undefined,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total,
      paidAmount: 0,
      status: mode === "draft" ? "draft" : "sent",
      source,
      notes: input.notes || undefined,
      createdBy: "Salma H.",
      createdAt: new Date().toISOString(),
      sentAt: mode === "send" ? new Date().toISOString() : undefined,
      payments: [],
    };
    invoices = [invoice, ...invoices];
    invoiceSeq += 1;
    return invoice;
  },

  update: async (id: string, input: NewInvoiceInput): Promise<void> => {
    await delay();
    const totals = computeTotals(input.lines, input.discountPercent ?? 0);
    invoices = invoices.map((inv) =>
      inv.id === id
        ? {
            ...inv,
            customerId: input.customerId,
            issueDate: input.issueDate,
            dueDate: input.dueDate,
            currency: input.currency ?? inv.currency,
            lines: input.lines.map((l) => ({ ...l, id: newId("ln"), total: round2(l.quantity * l.unitPrice) })),
            subtotal: totals.subtotal,
            discountPercent: input.discountPercent || undefined,
            discount: totals.discount,
            tax: totals.tax,
            total: totals.total,
            notes: input.notes || undefined,
          }
        : inv
    );
  },

  send: async (id: string): Promise<void> => {
    await delay();
    invoices = invoices.map((inv) =>
      inv.id === id && inv.status === "draft"
        ? { ...inv, status: "sent", sentAt: inv.sentAt ?? new Date().toISOString() }
        : inv
    );
  },

  recordPayment: async (id: string, input: RecordPaymentInput): Promise<void> => {
    await delay();
    invoices = invoices.map((inv) => {
      if (inv.id !== id) return inv;
      const paidAmount = round2(inv.paidAmount + input.amount);
      const fullyPaid = paidAmount >= inv.total - 0.005;
      return {
        ...inv,
        paidAmount,
        status: fullyPaid ? "paid" : "partially-paid",
        payments: [...inv.payments, { id: newId("pay"), date: input.date, amount: input.amount, method: input.method as PaymentMethod, reference: input.reference }],
      };
    });
  },

  cancel: async (id: string): Promise<void> => {
    await delay();
    invoices = invoices.map((inv) =>
      inv.id === id && inv.status !== "paid"
        ? { ...inv, status: "cancelled", cancelledAt: new Date().toISOString() }
        : inv
    );
  },

  sendReminder: async (id: string): Promise<void> => {
    await delay(500);
    invoices = invoices.map((inv) =>
      inv.id === id ? { ...inv, lastReminderAt: new Date().toISOString() } : inv
    );
  },
};
