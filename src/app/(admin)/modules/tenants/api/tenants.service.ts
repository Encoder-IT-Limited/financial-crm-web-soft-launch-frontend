import type { Tenant } from "../types";
import type { TenantEditValues } from "../schemas";
import { seedTenants } from "../mock/seed";
import { auditApi } from "../../audit/api/audit.service";

/** Simulated network latency for the mock API. */
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const RETENTION_DAYS = 60; // default; Settings §3.5 will make this configurable

// In-memory mock "database" — module-scoped, resets on page reload. Replaces
// the old Zustand store; React Query (useQuery/invalidateQueries) is now the
// reactivity layer, this is just the data these functions read/write.
let tenants: Tenant[] = seedTenants;

/**
 * Mock API service layer for All Clients. Every function returns a Promise
 * so the UI consumes it exactly like the real REST API (apiGet/apiSend
 * pattern in Basic-Setup.md §6) — swap the bodies for real calls later
 * without touching any component.
 */
export const tenantsApi = {
  list: async (): Promise<Tenant[]> => {
    await delay(250);
    return tenants;
  },

  get: async (id: string): Promise<Tenant | undefined> => {
    await delay(200);
    return tenants.find((tenant) => tenant.id === id);
  },

  suspend: async (id: string): Promise<void> => {
    await delay();
    const tenant = tenants.find((t) => t.id === id);
    if (!tenant) return;
    tenants = tenants.map((t) => (t.id === id ? { ...t, status: "read-only" } : t));
    await auditApi.logEntry({
      tenantId: tenant.id,
      tenantName: tenant.name,
      module: "Tenants",
      entity: "Tenant",
      entityLabel: tenant.name,
      action: "suspend",
      oldValues: { status: tenant.status },
      newValues: { status: "read-only" },
    });
  },

  reactivate: async (id: string): Promise<void> => {
    await delay();
    const tenant = tenants.find((t) => t.id === id);
    if (!tenant) return;
    tenants = tenants.map((t) => (t.id === id ? { ...t, status: "active", pendingDeletionAt: undefined } : t));
    await auditApi.logEntry({
      tenantId: tenant.id,
      tenantName: tenant.name,
      module: "Tenants",
      entity: "Tenant",
      entityLabel: tenant.name,
      action: "reactivate",
      oldValues: { status: tenant.status },
      newValues: { status: "active" },
    });
  },

  addSeats: async (id: string, count: number): Promise<void> => {
    await delay();
    const tenant = tenants.find((t) => t.id === id);
    if (!tenant || count <= 0) return;
    const nextExtra = tenant.extraSeatsPurchased + count;
    tenants = tenants.map((t) => (t.id === id ? { ...t, extraSeatsPurchased: nextExtra } : t));
    await auditApi.logEntry({
      tenantId: tenant.id,
      tenantName: tenant.name,
      module: "Tenants",
      entity: "Tenant",
      entityLabel: tenant.name,
      action: "update",
      oldValues: { extraSeatsPurchased: tenant.extraSeatsPurchased },
      newValues: { extraSeatsPurchased: nextExtra },
    });
  },

  update: async (id: string, input: TenantEditValues): Promise<void> => {
    await delay();
    const tenant = tenants.find((t) => t.id === id);
    if (!tenant) return;
    // Editing status directly here (vs. the guarded Suspend/Reactivate flow)
    // still needs to keep the pending-deletion retention countdown correct.
    const pendingDeletionAt =
      input.status === "pending-deletion"
        ? (tenant.pendingDeletionAt ?? new Date(Date.now() + RETENTION_DAYS * 86_400_000).toISOString())
        : undefined;
    tenants = tenants.map((t) => (t.id === id ? { ...t, ...input, pendingDeletionAt } : t));
    await auditApi.logEntry({
      tenantId: tenant.id,
      tenantName: input.name,
      module: "Tenants",
      entity: "Tenant",
      entityLabel: input.name,
      action: "update",
      oldValues: { name: tenant.name, planId: tenant.planId, status: tenant.status, billingCycle: tenant.billingCycle },
      newValues: input,
    });
  },

  delete: async (id: string): Promise<void> => {
    await delay();
    const tenant = tenants.find((t) => t.id === id);
    if (!tenant) return;
    tenants = tenants.filter((t) => t.id !== id);
    await auditApi.logEntry({
      tenantId: tenant.id,
      tenantName: tenant.name,
      module: "Tenants",
      entity: "Tenant",
      entityLabel: tenant.name,
      action: "delete",
      oldValues: { status: tenant.status },
      newValues: null,
    });
  },
};

export { RETENTION_DAYS };
