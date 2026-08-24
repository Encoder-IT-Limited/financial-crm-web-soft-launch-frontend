/* ------------------------------------------------------------------ */
/* Recurring invoices — template model for docs/inv-pos-hr-tenant.md   */
/* §22.11 (Recurring Invoice Workflow). Each active template generates */
/* a new invoice when its next billing date arrives (manual due-date   */
/* worker in the UI for this frontend-only build).                     */
/* ------------------------------------------------------------------ */

import type { Currency } from "../types";

export type RecurrenceFrequency = "weekly" | "monthly" | "quarterly" | "yearly";

export const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export const RECURRENCE_FREQUENCIES = Object.keys(FREQUENCY_LABELS) as RecurrenceFrequency[];

export type RecurringTemplateStatus = "active" | "paused";

/** "invoice" (default, absent = invoice) generates a normal draft invoice
 *  each cycle. "retainer-topup" (Phase H2) instead generates a Paid invoice
 *  and tops up the linked retainer's balance — reuses this same template/
 *  cadence engine rather than a second scheduler (Sales-Invoicing-
 *  Implementation-Plan.md Key Decision #7). */
export type RecurringTemplateKind = "invoice" | "retainer-topup";

export type RecurringTemplate = {
  id: string;
  number: string; // REC-001 — own sequence, separate from INV-
  customerId: string;
  description: string;
  currency: Currency;
  amount: number; // per cycle, billed as a single line item
  frequency: RecurrenceFrequency;
  nextInvoiceDate: string; // ISO date — when the next cycle should generate
  status: RecurringTemplateStatus;
  kind?: RecurringTemplateKind; // absent = "invoice"
  retainerId?: string; // set when kind is "retainer-topup"
  lastInvoiceId?: string; // most recent generated invoice
  lastGeneratedAt?: string; // ISO
  createdAt: string;
};

export type NewRecurringTemplateInput = {
  customerId: string;
  description: string;
  currency: Currency;
  amount: number;
  frequency: RecurrenceFrequency;
  nextInvoiceDate: string;
  kind?: RecurringTemplateKind;
  retainerId?: string;
};

/** Advance a date by one cycle of the given frequency (longer cycles keep
 *  the day-of-month from the previous next date). */
export function advanceDate(iso: string, frequency: RecurrenceFrequency): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  if (frequency === "weekly") {
    date.setDate(date.getDate() + 7);
  } else if (frequency === "monthly") {
    date.setMonth(date.getMonth() + 1);
  } else if (frequency === "quarterly") {
    date.setMonth(date.getMonth() + 3);
  } else {
    date.setFullYear(date.getFullYear() + 1);
  }
  return date.toISOString().slice(0, 10);
}