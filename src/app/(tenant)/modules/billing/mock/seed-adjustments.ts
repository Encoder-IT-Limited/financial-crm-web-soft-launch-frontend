import type { Adjustment } from "../types";
import { day } from "./seed";

export const seedAdjustments: Adjustment[] = [
  {
    id: "adj-cn-0002",
    number: "CN-0002",
    kind: "credit",
    customerId: "cust-alnoor",
    invoiceId: "inv-0043",
    amount: 250,
    reason: "Damaged goods reported on delivery — partial credit issued.",
    currency: "AED",
    status: "issued",
    createdBy: "Salma H.",
    createdAt: day(-5),
  },
  {
    id: "adj-cn-0001",
    number: "CN-0001",
    kind: "credit",
    customerId: "cust-reem",
    invoiceId: "inv-0042",
    amount: 500,
    reason: "Goodwill credit for delayed handover.",
    currency: "AED",
    status: "issued",
    createdBy: "Salma H.",
    createdAt: day(-20),
  },
  {
    id: "adj-dn-0001",
    number: "DN-0001",
    kind: "debit",
    customerId: "cust-khalifa",
    invoiceId: "inv-0044",
    amount: 150,
    reason: "Additional courier charges not included on the original invoice.",
    currency: "AED",
    status: "issued",
    createdBy: "Salma H.",
    createdAt: day(-15),
  },
];

export const seedCreditNoteSeq = 3; // next auto-assigned number is CN-0003
export const seedDebitNoteSeq = 2; // next auto-assigned number is DN-0002
