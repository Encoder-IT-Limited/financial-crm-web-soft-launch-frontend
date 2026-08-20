import type { PaymentTransaction } from "../types";

const HOUR = 3_600_000;
const iso = (hoursAgo: number) => new Date(Date.now() - hoursAgo * HOUR).toISOString();

export const seedPayments: PaymentTransaction[] = [
  {
    id: "pay-1",
    tenantId: "tenant-1",
    tenantName: "Al Reem Trading LLC",
    reference: "PLT-2295",
    planName: "Growth",
    type: "additional_seat",
    amount: 78,
    method: "card",
    status: "paid",
    date: iso(3),
  },
  {
    id: "pay-2",
    tenantId: "tenant-5",
    tenantName: "Bloom Café Group",
    reference: "PLT-2294",
    planName: "Starter",
    type: "subscription_charge",
    amount: 199,
    method: "card",
    status: "paid",
    date: iso(20),
  },
  // Matches audit-4's "INV-PLT-2291" entry (audit/mock/seed.ts) so the two
  // widgets tell a consistent story about Falcon Logistics' failed renewal.
  {
    id: "pay-3",
    tenantId: "tenant-4",
    tenantName: "Falcon Logistics",
    reference: "PLT-2291",
    planName: "Enterprise",
    type: "subscription_charge",
    amount: 999,
    method: "card",
    status: "failed",
    date: iso(50),
  },
  {
    id: "pay-4",
    tenantId: "tenant-2",
    tenantName: "Zafra Consulting",
    reference: "PLT-2287",
    planName: "Starter",
    type: "subscription_charge",
    amount: 1910,
    method: "bank",
    status: "paid",
    date: iso(96),
  },
  {
    id: "pay-5",
    tenantId: "tenant-3",
    tenantName: "Nakheel Retail Co.",
    reference: "PLT-2260",
    planName: "Growth",
    type: "refund",
    amount: 499,
    method: "card",
    status: "refunded",
    date: iso(140),
  },
];
