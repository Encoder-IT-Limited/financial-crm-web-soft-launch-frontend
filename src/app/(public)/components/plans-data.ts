import type { Plan } from "@/types/plan";

// TEMPORARY: no backend/plansService yet (see docs/plans/Public-SuperAdmin-Plan.md §2.3).
// Once Super Admin's Plans & Pricing exists, this should be replaced by a real fetch
// so /pricing and /signup's plan step both reflect the same source of truth.
export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 199,
    priceYearly: 1910, // 199 × 12 × 0.8, rounded — a clean "Save 20%" annually
    baseSeats: 3,
    additionalSeatPrice: 39,
    trialDays: 14,
    minSeats: 3,
    maxSeats: 10,
    modules: ["accounting", "sales", "purchasing", "banking"],
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthly: 499,
    priceYearly: 4790, // 499 × 12 × 0.8, rounded — a clean "Save 20%" annually
    baseSeats: 10,
    additionalSeatPrice: 29,
    trialDays: 14,
    minSeats: 10,
    maxSeats: 30,
    modules: ["accounting", "sales", "purchasing", "inventory", "banking", "crm", "reports"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 999,
    priceYearly: 9590, // 999 × 12 × 0.8, rounded — same clean "Save 20%" annually
    baseSeats: 25,
    additionalSeatPrice: 19,
    trialDays: 14,
    minSeats: 30,
    // maxSeats intentionally omitted — Enterprise is 30+, unlimited.
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
