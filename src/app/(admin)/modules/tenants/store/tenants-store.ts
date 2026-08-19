"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuditStore } from "../../audit/store/audit-store";
import type { Tenant } from "../types";
import { seedTenants } from "../mock/seed";

const RETENTION_DAYS = 60; // default; Settings §3.5 will make this configurable

type TenantsStore = {
  tenants: Tenant[];

  // --- actions (all synchronous; the service layer adds the mock latency) ---
  suspendTenant: (id: string) => void;
  reactivateTenant: (id: string) => void;
  addSeats: (id: string, count: number) => void;
};

export const useTenantsStore = create<TenantsStore>()(
  persist(
    (set, get) => ({
      tenants: seedTenants,

      suspendTenant: (id) => {
        const tenant = get().tenants.find((t) => t.id === id);
        if (!tenant) return;
        set((state) => ({
          tenants: state.tenants.map((t) => (t.id === id ? { ...t, status: "read-only" } : t)),
        }));
        useAuditStore.getState().logEntry({
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

      reactivateTenant: (id) => {
        const tenant = get().tenants.find((t) => t.id === id);
        if (!tenant) return;
        set((state) => ({
          tenants: state.tenants.map((t) =>
            t.id === id ? { ...t, status: "active", pendingDeletionAt: undefined } : t
          ),
        }));
        useAuditStore.getState().logEntry({
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

      addSeats: (id, count) => {
        const tenant = get().tenants.find((t) => t.id === id);
        if (!tenant || count <= 0) return;
        const nextExtra = tenant.extraSeatsPurchased + count;
        set((state) => ({
          tenants: state.tenants.map((t) => (t.id === id ? { ...t, extraSeatsPurchased: nextExtra } : t)),
        }));
        useAuditStore.getState().logEntry({
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
    }),
    { name: "admin-tenants-store" }
  )
);

export { RETENTION_DAYS };
