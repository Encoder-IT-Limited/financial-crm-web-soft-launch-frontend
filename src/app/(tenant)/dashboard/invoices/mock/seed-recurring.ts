/* Seed recurring templates — dates are relative to "today" so the
 * schedules stay live across page loads. */
import { newId } from "@/lib/format";
import type { RecurringTemplate } from "../recurring/types";

function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export const seedRecurringTemplates: RecurringTemplate[] = [
  {
    id: newId("rec"),
    number: "REC-001",
    customerId: "cust-gulf",
    description: "Monthly managed IT retainer",
    currency: "AED",
    amount: 4800,
    frequency: "monthly",
    nextInvoiceDate: addDays(5),
    status: "active",
    createdAt: new Date(new Date().getTime() - 90 * 86_400_000).toISOString(),
  },
  {
    id: newId("rec"),
    number: "REC-002",
    customerId: "cust-alnoor",
    description: "Quarterly storage & logistics fee",
    currency: "AED",
    amount: 9750,
    frequency: "quarterly",
    nextInvoiceDate: addDays(18),
    status: "active",
    createdAt: new Date(new Date().getTime() - 45 * 86_400_000).toISOString(),
  },
];

export const seedRecurringTemplateSeq = 3;