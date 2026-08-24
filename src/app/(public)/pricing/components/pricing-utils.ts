import type { Plan } from "@/types/plan";
import type { ModuleKey } from "@/lib/permissions";

export type BillingPeriod = "monthly" | "yearly";

/** basePrice + extra seats beyond baseSeats × the per-seat rate. Enterprise
 * (priceMonthly === 0) is always "Custom", ignoring the seat count. Yearly
 * extra-seat pricing gets the same 20% discount as the base price. */
export function computePlanTotal(plan: Plan, seats: number, billing: BillingPeriod): number {
  if (plan.priceMonthly === 0) return 0;

  const extraSeats = Math.max(0, seats - plan.baseSeats);
  if (billing === "monthly") {
    return plan.priceMonthly + extraSeats * plan.additionalSeatPrice;
  }
  const extraSeatYearly = Math.round(plan.additionalSeatPrice * 12 * 0.8);
  return plan.priceYearly + extraSeats * extraSeatYearly;
}

/** Clamps a requested seat count into what this plan actually supports —
 * e.g. Starter tops out at 10 seats, so an Enterprise-sized team estimated
 * on the shared seat control still prices Starter at its own maximum
 * rather than extrapolating past what the plan is sold for. */
export function clampSeatsForPlan(plan: Plan, seats: number): number {
  const upper = plan.maxSeats ?? Infinity;
  return Math.min(upper, Math.max(plan.minSeats, seats));
}

/** Modules newly introduced at this tier vs. the previous one — lets each
 * card read "Everything in X, plus…" instead of repeating the full list. */
export function incrementalModules(plans: Plan[], index: number): ModuleKey[] {
  if (index === 0) return plans[0].modules;
  const previous = new Set(plans[index - 1].modules);
  return plans[index].modules.filter((m) => !previous.has(m));
}
