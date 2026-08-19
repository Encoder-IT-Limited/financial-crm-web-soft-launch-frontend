import type { Tenant } from "../types";

const DAY = 86_400_000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString();

export const seedTenants: Tenant[] = [
  {
    id: "tenant-1",
    name: "Al Reem Trading LLC",
    planId: "growth",
    status: "active",
    billingCycle: "monthly",
    extraSeatsPurchased: 2,
    createdAt: iso(-210),
    renewalDate: iso(18),
    users: [
      { id: "u1", name: "Salma H.", email: "salma@alreem.ae", role: "owner" },
      { id: "u2", name: "Youssef K.", email: "youssef@alreem.ae", role: "admin" },
      { id: "u3", name: "Priya N.", email: "priya@alreem.ae", role: "staff" },
      { id: "u4", name: "POS Till 1", email: "pos1@alreem.ae", role: "pos-cashier" },
      { id: "u5", name: "Zapier Bridge", email: "svc@alreem.ae", role: "service-api" },
    ],
  },
  {
    id: "tenant-2",
    name: "Zafra Consulting",
    planId: "starter",
    status: "active",
    billingCycle: "yearly",
    extraSeatsPurchased: 0,
    createdAt: iso(-40),
    renewalDate: iso(325),
    users: [
      { id: "u6", name: "Omar F.", email: "omar@zafra.co", role: "owner" },
      { id: "u7", name: "Lina T.", email: "lina@zafra.co", role: "staff" },
    ],
  },
  {
    id: "tenant-3",
    name: "Nakheel Retail Co.",
    planId: "growth",
    status: "read-only",
    billingCycle: "monthly",
    extraSeatsPurchased: 0,
    createdAt: iso(-300),
    renewalDate: iso(-3),
    users: [
      { id: "u8", name: "Hind A.", email: "hind@nakheel.ae", role: "owner" },
      { id: "u9", name: "Karim S.", email: "karim@nakheel.ae", role: "admin" },
      { id: "u10", name: "Auditor Access", email: "audit@nakheel.ae", role: "read-only-auditor" },
    ],
  },
  {
    id: "tenant-4",
    name: "Falcon Logistics",
    planId: "enterprise",
    status: "pending-deletion",
    billingCycle: "monthly",
    extraSeatsPurchased: 5,
    createdAt: iso(-500),
    renewalDate: iso(-45),
    pendingDeletionAt: iso(15),
    users: [
      { id: "u11", name: "Rashid M.", email: "rashid@falconlog.ae", role: "owner" },
      { id: "u12", name: "Anya P.", email: "anya@falconlog.ae", role: "admin" },
    ],
  },
  {
    id: "tenant-5",
    name: "Bloom Café Group",
    planId: "starter",
    status: "active",
    billingCycle: "monthly",
    extraSeatsPurchased: 1,
    createdAt: iso(-12),
    renewalDate: iso(18),
    users: [
      { id: "u13", name: "Fatima R.", email: "fatima@bloomcafe.ae", role: "owner" },
      { id: "u14", name: "POS Till A", email: "pos-a@bloomcafe.ae", role: "pos-cashier" },
      { id: "u15", name: "POS Till B", email: "pos-b@bloomcafe.ae", role: "pos-cashier" },
    ],
  },
  {
    id: "tenant-6",
    name: "Marbella Interiors",
    planId: "enterprise",
    status: "cancelled",
    billingCycle: "yearly",
    extraSeatsPurchased: 0,
    createdAt: iso(-620),
    renewalDate: iso(-90),
    users: [{ id: "u16", name: "Dana W.", email: "dana@marbella.ae", role: "owner" }],
  },
];
