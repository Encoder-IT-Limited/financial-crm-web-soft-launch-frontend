import { newId } from "@/lib/format";
import type { AuditLogEntry } from "../types";
import { seedAuditLog } from "../mock/seed";

/** Simulated network latency for the mock API. */
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

type NewAuditLogInput = Omit<AuditLogEntry, "id" | "timestamp" | "userName" | "userEmail" | "ipAddress">;

// In-memory mock "database" — module-scoped, resets on page reload. Replaces
// the old Zustand store; React Query (useQuery/invalidateQueries) is now the
// reactivity layer, this is just the data these functions read/write.
let entries: AuditLogEntry[] = seedAuditLog;

/**
 * Mock API service layer for the platform Audit Log. Returns Promises so the
 * UI consumes it exactly like the real REST API (apiGet pattern in
 * Basic-Setup.md §6) — swap the body for a real call later without touching
 * any component.
 */
export const auditApi = {
  list: async (): Promise<AuditLogEntry[]> => {
    await delay();
    return entries;
  },

  listForTenant: async (tenantId: string): Promise<AuditLogEntry[]> => {
    await delay(200);
    return entries.filter((entry) => entry.tenantId === tenantId);
  },

  /** Appends an entry as the current (mock) Super Admin session. Other
   * services (Tenants, Plans, Payments) call this when they mutate data so
   * the Audit Log stays the single trail across the platform. */
  logEntry: async (input: NewAuditLogInput): Promise<AuditLogEntry> => {
    const entry: AuditLogEntry = {
      id: newId("audit"),
      timestamp: new Date().toISOString(),
      userName: "MRM Super Admin",
      userEmail: "admin@mrm.io",
      ipAddress: "10.20.4.11",
      ...input,
    };
    entries = [entry, ...entries];
    return entry;
  },
};
