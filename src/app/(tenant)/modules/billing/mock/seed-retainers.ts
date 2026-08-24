import type { Retainer } from "../types";
import { day } from "./seed";

export const seedRetainers: Retainer[] = [
  {
    id: "ret-0003",
    number: "RET-0003",
    customerId: "cust-gulf",
    contractAmount: 60000,
    billingPeriod: "quarterly",
    billingModel: "recurring",
    remainingBalance: 42500,
    currency: "AED",
    status: "active",
    startDate: day(-40),
    expiryDate: day(325),
    notes: "IT support retainer — Q3 contract.",
    createdBy: "Salma H.",
    createdAt: day(-40),
    usage: [
      { id: "use-1", date: day(-25), amount: 9500, note: "Server migration support" },
      { id: "use-2", date: day(-8), amount: 8000, note: "Monthly maintenance window" },
    ],
  },
  {
    id: "ret-0002",
    number: "RET-0002",
    customerId: "cust-reem",
    contractAmount: 36000,
    billingPeriod: "monthly",
    billingModel: "one-time",
    remainingBalance: 0,
    currency: "AED",
    status: "closed",
    startDate: day(-120),
    notes: "Facility consulting retainer — fully utilized.",
    createdBy: "Salma H.",
    createdAt: day(-120),
    usage: [
      { id: "use-3", date: day(-90), amount: 18000, note: "Site audits" },
      { id: "use-4", date: day(-45), amount: 18000, note: "Final consultation phase" },
    ],
  },
  {
    id: "ret-0001",
    number: "RET-0001",
    customerId: "cust-khalifa",
    contractAmount: 24000,
    billingPeriod: "monthly",
    billingModel: "one-time",
    remainingBalance: 24000,
    currency: "AED",
    status: "paused",
    startDate: day(-10),
    expiryDate: day(10),
    notes: "Media retainer — on hold pending scope confirmation.",
    createdBy: "Salma H.",
    createdAt: day(-10),
    usage: [],
  },
];

export const seedRetainerSeq = 4; // next auto-assigned number is RET-0004
