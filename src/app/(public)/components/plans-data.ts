import type { Plan } from "@/types/plan";

// TEMPORARY: no backend/plansService yet (see docs/Public-SuperAdmin-Plan.md §2.3).
// Once Super Admin's Plans & Pricing exists, this should be replaced by a real fetch
// so /pricing and /signup's plan step both reflect the same source of truth.
export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 199,
    priceYearly: 1990,
    baseSeats: 3,
    additionalSeatPrice: 39,
    trialDays: 14,
    modules: ["accounting", "sales", "purchasing", "banking"],
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthly: 499,
    priceYearly: 4990,
    baseSeats: 10,
    additionalSeatPrice: 29,
    trialDays: 14,
    modules: ["accounting", "sales", "purchasing", "inventory", "banking", "crm", "reports"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 0,
    priceYearly: 0,
    baseSeats: 0,
    additionalSeatPrice: 0,
    trialDays: 0,
    modules: [
      "accounting",
      "sales",
      "purchasing",
      "inventory",
      "banking",
      "crm",
      "reports",
      "ai-assistant",
    ],
  },
];
