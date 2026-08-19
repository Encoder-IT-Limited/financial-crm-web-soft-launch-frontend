"use client";

import type { Plan } from "@/types/plan";
import type { PlanFormValues } from "../schemas";
import { usePlansStore } from "../store/plans-store";

/** Simulated network latency for the mock API. */
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock API service layer for Plans & Pricing. Every function returns a
 * Promise so the UI consumes it exactly like the real REST API
 * (apiGet/apiSend pattern in Basic-Setup.md §6) — swap the bodies for real
 * calls later without touching any component.
 */
export const planApi = {
  list: async (): Promise<Plan[]> => {
    await delay(250);
    return usePlansStore.getState().plans;
  },

  get: async (id: string): Promise<Plan | undefined> => {
    await delay(200);
    return usePlansStore.getState().plans.find((plan) => plan.id === id);
  },

  create: async (input: PlanFormValues): Promise<Plan> => {
    await delay();
    return usePlansStore.getState().createPlan(input);
  },

  update: async (id: string, input: PlanFormValues): Promise<void> => {
    await delay();
    usePlansStore.getState().updatePlan(id, input);
  },

  delete: async (id: string): Promise<void> => {
    await delay();
    usePlansStore.getState().deletePlan(id);
  },
};
