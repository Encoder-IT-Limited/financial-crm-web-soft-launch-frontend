"use client";

import type { Tenant } from "../types";
import { useTenantsStore } from "../store/tenants-store";

/** Simulated network latency for the mock API. */
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock API service layer for All Clients. Every function returns a Promise
 * so the UI consumes it exactly like the real REST API (apiGet/apiSend
 * pattern in Basic-Setup.md §6) — swap the bodies for real calls later
 * without touching any component.
 */
export const tenantsApi = {
  list: async (): Promise<Tenant[]> => {
    await delay(250);
    return useTenantsStore.getState().tenants;
  },

  get: async (id: string): Promise<Tenant | undefined> => {
    await delay(200);
    return useTenantsStore.getState().tenants.find((tenant) => tenant.id === id);
  },

  suspend: async (id: string): Promise<void> => {
    await delay();
    useTenantsStore.getState().suspendTenant(id);
  },

  reactivate: async (id: string): Promise<void> => {
    await delay();
    useTenantsStore.getState().reactivateTenant(id);
  },

  addSeats: async (id: string, count: number): Promise<void> => {
    await delay();
    useTenantsStore.getState().addSeats(id, count);
  },
};
