"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { newId, nextSequence } from "@/lib/format";
import {
  computeTotals,
  round2,
  type Customer,
  type Invoice,
  type NewInvoiceInput,
  type OrgProfile,
  type PaymentMethod,
  type RecordPaymentInput,
} from "../types";
import { seedCustomers, seedInvoiceSeq, seedInvoices, seedOrgProfile } from "../mock/seed";

type InvoicesStore = {
  invoices: Invoice[];
  invoiceSeq: number;
  customers: Customer[];
  orgProfile: OrgProfile;

  // --- actions (all synchronous; the service layer adds the mock latency) ---
  createInvoice: (input: NewInvoiceInput, mode: "draft" | "send") => Invoice;
  updateInvoice: (id: string, input: NewInvoiceInput) => void;
  sendInvoice: (id: string) => void;
  recordPayment: (id: string, input: RecordPaymentInput) => void;
  cancelInvoice: (id: string) => void;
  sendReminder: (id: string) => void;
  addCustomer: (customer: Omit<Customer, "id" | "currency">) => Customer;
};

export const useInvoicesStore = create<InvoicesStore>()(
  persist(
    (set, get) => ({
      invoices: seedInvoices,
      invoiceSeq: seedInvoiceSeq,
      customers: seedCustomers,
      orgProfile: seedOrgProfile,

      createInvoice: (input, mode) => {
        const number = `INV-${nextSequence(get().invoiceSeq)}`;
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
          notes: input.notes || undefined,
          createdBy: "Salma H.",
          createdAt: new Date().toISOString(),
          sentAt: mode === "send" ? new Date().toISOString() : undefined,
          payments: [],
        };
        set((state) => ({ invoices: [invoice, ...state.invoices], invoiceSeq: state.invoiceSeq + 1 }));
        return invoice;
      },

      updateInvoice: (id, input) => {
        const totals = computeTotals(input.lines, input.discountPercent ?? 0);
        set((state) => ({
          invoices: state.invoices.map((inv) =>
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
          ),
        }));
      },

      sendInvoice: (id) => {
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id && inv.status === "draft"
              ? { ...inv, status: "sent", sentAt: inv.sentAt ?? new Date().toISOString() }
              : inv
          ),
        }));
      },

      recordPayment: (id, input) => {
        set((state) => ({
          invoices: state.invoices.map((inv) => {
            if (inv.id !== id) return inv;
            const paidAmount = round2(inv.paidAmount + input.amount);
            const fullyPaid = paidAmount >= inv.total - 0.005;
            return {
              ...inv,
              paidAmount,
              status: fullyPaid ? "paid" : "partially-paid",
              payments: [...inv.payments, { id: newId("pay"), date: input.date, amount: input.amount, method: input.method as PaymentMethod, reference: input.reference }],
            };
          }),
        }));
      },

      cancelInvoice: (id) => {
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id && inv.status !== "paid"
              ? { ...inv, status: "cancelled", cancelledAt: new Date().toISOString() }
              : inv
          ),
        }));
      },

      sendReminder: (id) => {
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id ? { ...inv, lastReminderAt: new Date().toISOString() } : inv
          ),
        }));
      },

      addCustomer: (customer) => {
        const created: Customer = { ...customer, id: newId("cust"), currency: "AED" };
        set((state) => ({ customers: [...state.customers, created] }));
        return created;
      },
    }),
    {
      name: "mrm-billing-v1",
      version: 1,
      // Backfill fields added after the store was first persisted
      // (e.g. `discount`) without wiping a user's data.
      merge: (_persisted, current) => {
        const stored = _persisted as InvoicesStore;
        return {
          ...structuredClone(current),
          ...stored,
          invoices: stored.invoices.map((inv) => ({
            ...inv,
            discount: "discount" in inv ? (inv.discount ?? 0) : 0,
            discountPercent: "discountPercent" in inv ? inv.discountPercent : undefined,
          })),
        };
      },
    }
  )
);