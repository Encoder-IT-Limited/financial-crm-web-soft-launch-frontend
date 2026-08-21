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