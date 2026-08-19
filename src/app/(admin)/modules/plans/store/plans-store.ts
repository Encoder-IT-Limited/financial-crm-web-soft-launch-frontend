"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { newId } from "@/lib/format";
import type { Plan } from "@/types/plan";
import { PLANS } from "@/app/(public)/components/plans-data";
import type { PlanFormValues } from "../schemas";

type PlansStore = {
  plans: Plan[];

  // --- actions (all synchronous; the service layer adds the mock latency) ---
  createPlan: (input: PlanFormValues) => Plan;
  updatePlan: (id: string, input: PlanFormValues) => void;
  deletePlan: (id: string) => void;
};

// Seeded from the same PLANS array `/pricing` and `/signup` read from
// (src/app/(public)/components/plans-data.ts) so the two stay in sync at
// load time. Edits made here only persist to this store's localStorage
// snapshot — there's no backend yet to push them back to the public site.
// See docs/Public-SuperAdmin-Plan.md §2.3/§3.2.
export const usePlansStore = create<PlansStore>()(
  persist(
    (set) => ({
      plans: PLANS,

      createPlan: (input) => {
        const plan: Plan = { id: newId("plan"), ...input };
        set((state) => ({ plans: [...state.plans, plan] }));
        return plan;
      },

      updatePlan: (id, input) => {
        set((state) => ({
          plans: state.plans.map((plan) => (plan.id === id ? { ...plan, ...input } : plan)),
        }));
      },

      deletePlan: (id) => {
        set((state) => ({ plans: state.plans.filter((plan) => plan.id !== id) }));
      },
    }),
    { name: "admin-plans-store" }
  )
);
