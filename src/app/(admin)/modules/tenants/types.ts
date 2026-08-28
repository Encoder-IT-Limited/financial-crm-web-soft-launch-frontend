/* ------------------------------------------------------------------ */
/* All Clients — domain model. Frontend-only mock (docs/Public-        */
/* SuperAdmin-Plan.md §3.1/§3.8). `TenantStatus` lives on the shared    */
/* StatusBadge component since both live and drive the same colors.    */
/* ------------------------------------------------------------------ */

import type { Plan } from "@/types/plan";
import type { TenantStatus } from "@/components/shared/status-badge";
import { computePlanTotal } from "@/app/(public)/pricing/components/pricing-utils";

export type TenantUserRole =
  | "owner"
  | "admin"
  | "manager"
  | "inventory-manager"
  | "staff"
  | "pos-cashier"
  | "accountant"
  | "service-api"
  | "read-only-auditor";

export const TENANT_ROLE_LABELS: Record<TenantUserRole, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  "inventory-manager": "Inventory Manager",
  staff: "Staff",
  "pos-cashier": "POS Cashier",
  accountant: "Accountant",
  "service-api": "Service / API",
  "read-only-auditor": "Read-only Auditor",
};

/** Which account roles count toward the plan's seat limit — service/API and
 * read-only auditor accounts don't (docs/Public-SuperAdmin-Plan.md §3.1). */
const SEAT_COUNTING_ROLES: TenantUserRole[] = [
  "owner",
  "admin",
  "manager",
  "inventory-manager",
  "staff",
  "pos-cashier",
  "accountant",
];

export type TenantUser = {
  id: string;
  name: string;
  email: string;
  role: TenantUserRole;
};

export type BillingCycle = "monthly" | "yearly";

export type Tenant = {
  id: string;
  name: string;
  /** Registered/legal company name — may differ from the display `name`. */
  legalName: string;
  email: string;
  phone: string;
  address: string;
  planId: string;
  status: TenantStatus;
  billingCycle: BillingCycle;
  /** Seats bought beyond the plan's included `baseSeats`. */
  extraSeatsPurchased: number;
  createdAt: string; // ISO
  renewalDate: string; // ISO
  /** Set once status becomes "pending-deletion" — the permanent-deletion
   * target date, per the 30-90 day retention window (Q2). */
  pendingDeletionAt?: string;
  users: TenantUser[];
};

export function seatUsage(tenant: Tenant, plan: Plan | undefined) {
  const used = tenant.users.filter((u) => SEAT_COUNTING_ROLES.includes(u.role)).length;
  const total = (plan?.baseSeats ?? 0) + tenant.extraSeatsPurchased;
  return { used, total };
}

/** Monthly recurring revenue for this tenant, reusing the same seat-pricing
 * math the public pricing calculator uses (§2.6) so the two never drift. */
export function tenantMrr(tenant: Tenant, plan: Plan | undefined): number {
  if (!plan) return 0;
  const totalSeats = plan.baseSeats + tenant.extraSeatsPurchased;
  const periodTotal = computePlanTotal(plan, totalSeats, tenant.billingCycle);
  return tenant.billingCycle === "yearly" ? Math.round(periodTotal / 12) : periodTotal;
}
