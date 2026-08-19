"use client";

import type { AuditLogEntry } from "../types";
import { useAuditStore } from "../store/audit-store";

/** Simulated network latency for the mock API. */
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock API service layer for the platform Audit Log. Returns Promises so the
 * UI consumes it exactly like the real REST API (apiGet pattern in
 * Basic-Setup.md §6) — swap the body for a real call later without touching
 * any component.
 */
export const auditApi = {
  list: async (): Promise<AuditLogEntry[]> => {
    await delay();
    return useAuditStore.getState().entries;
  },

  listForTenant: async (tenantId: string): Promise<AuditLogEntry[]> => {
    await delay(200);
    return useAuditStore.getState().entries.filter((entry) => entry.tenantId === tenantId);
  },
};
