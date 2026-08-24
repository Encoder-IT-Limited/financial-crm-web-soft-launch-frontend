import { newId } from "@/lib/format";
import type { Plan } from "@/types/plan";
import { PLANS } from "@/app/(public)/components/plans-data";
import type { PlanFormValues } from "../schemas";
import { auditApi } from "../../audit/api/audit.service";

/** Simulated network latency for the mock API. */
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory mock "database" — module-scoped, resets on page reload. Replaces
// the old Zustand store; React Query (useQuery/invalidateQueries) is now the
// reactivity layer, this is just the data these functions read/write.
// Seeded from the same PLANS array `/pricing` and `/signup` read from
// (src/app/(public)/components/plans-data.ts) so the two stay in sync at
// load time — see docs/plans/Public-SuperAdmin-Plan.md §2.3/§3.2.
let plans: Plan[] = PLANS;

/**
 * Mock API service layer for Plans & Pricing. Every function returns a
 * Promise so the UI consumes it exactly like the real REST API
 * (apiGet/apiSend pattern in Basic-Setup.md §6) — swap the bodies for real
 * calls later without touching any component.
 */
export const planApi = {
  list: async (): Promise<Plan[]> => {
    await delay(250);
    return plans;
  },

  get: async (id: string): Promise<Plan | undefined> => {
    await delay(200);
    return plans.find((plan) => plan.id === id);
  },

  create: async (input: PlanFormValues): Promise<Plan> => {
    await delay();
    const plan: Plan = { id: newId("plan"), ...input };
    plans = [...plans, plan];
    await auditApi.logEntry({
      tenantId: null,
      tenantName: null,
      module: "Plans & Pricing",
      entity: "Plan",
      entityLabel: plan.name,
      action: "create",
      oldValues: null,
      newValues: { priceMonthly: plan.priceMonthly, priceYearly: plan.priceYearly, baseSeats: plan.baseSeats },
    });
    return plan;
  },

  update: async (id: string, input: PlanFormValues): Promise<void> => {
    await delay();
    const plan = plans.find((p) => p.id === id);
    if (!plan) return;
    plans = plans.map((p) => (p.id === id ? { ...p, ...input } : p));
    await auditApi.logEntry({
      tenantId: null,
      tenantName: null,
      module: "Plans & Pricing",
      entity: "Plan",
      entityLabel: input.name,
      action: "update",
      oldValues: {
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        baseSeats: plan.baseSeats,
        additionalSeatPrice: plan.additionalSeatPrice,
      },
      newValues: {
        priceMonthly: input.priceMonthly,
        priceYearly: input.priceYearly,
        baseSeats: input.baseSeats,
        additionalSeatPrice: input.additionalSeatPrice,
      },
    });
  },

  delete: async (id: string): Promise<void> => {
    await delay();
    const plan = plans.find((p) => p.id === id);
    if (!plan) return;
    plans = plans.filter((p) => p.id !== id);
    await auditApi.logEntry({
      tenantId: null,
      tenantName: null,
      module: "Plans & Pricing",
      entity: "Plan",
      entityLabel: plan.name,
      action: "delete",
      oldValues: { priceMonthly: plan.priceMonthly, baseSeats: plan.baseSeats },
      newValues: null,
    });
  },
};
