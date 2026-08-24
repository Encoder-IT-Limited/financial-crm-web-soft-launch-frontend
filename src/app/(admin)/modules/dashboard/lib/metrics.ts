import { daysFromNow } from "@/lib/format";
import type { Plan } from "@/types/plan";
import { tenantMrr, type Tenant } from "../../tenants/types";

/** Days left in a tenant's trial, derived from `Plan.trialDays` vs. the
 * tenant's `createdAt` (docs/plans/Public-SuperAdmin-Plan.md §3.0) — there's no
 * separate trial-start field to track yet. */
export function trialDaysLeft(tenant: Tenant, plan: Plan | undefined): number | null {
  if (!plan || plan.trialDays <= 0) return null;
  const trialEnd = new Date(tenant.createdAt).getTime() + plan.trialDays * 86_400_000;
  return daysFromNow(new Date(trialEnd).toISOString());
}

export function isTrialEndingSoon(tenant: Tenant, plan: Plan | undefined, withinDays = 7): boolean {
  if (tenant.status !== "active") return false;
  const daysLeft = trialDaysLeft(tenant, plan);
  return daysLeft !== null && daysLeft >= 0 && daysLeft <= withinDays;
}

/** Platform MRR — only actively-billing tenants count; read-only/pending-
 * deletion/cancelled tenants aren't currently generating revenue. */
export function platformMrr(tenants: Tenant[], plans: Plan[]): number {
  return tenants
    .filter((t) => t.status === "active")
    .reduce((sum, t) => sum + tenantMrr(t, plans.find((p) => p.id === t.planId)), 0);
}

/** Tenants created within the last `withinDays` days — a growth pulse. */
export function newTenantsCount(tenants: Tenant[], withinDays = 30): number {
  return tenants.filter((t) => {
    const ageInDays = -(daysFromNow(t.createdAt) ?? -Infinity);
    return ageInDays >= 0 && ageInDays <= withinDays;
  }).length;
}
