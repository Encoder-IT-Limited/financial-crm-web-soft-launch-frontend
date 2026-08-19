"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { newId } from "@/lib/format";
import type { AuditLogEntry } from "../types";
import { seedAuditLog } from "../mock/seed";

type NewAuditLogInput = Omit<AuditLogEntry, "id" | "timestamp" | "userName" | "userEmail" | "ipAddress">;

type AuditStore = {
  entries: AuditLogEntry[];
  /** Appends an entry as the current (mock) Super Admin session. Other
   * modules (Tenants, Plans, Payments) call this when they mutate state so
   * the Audit Log stays the single trail across the platform. */
  logEntry: (input: NewAuditLogInput) => void;
};

export const useAuditStore = create<AuditStore>()(
  persist(
    (set) => ({
      entries: seedAuditLog,

      logEntry: (input) => {
        const entry: AuditLogEntry = {
          id: newId("audit"),
          timestamp: new Date().toISOString(),
          userName: "MRM Super Admin",
          userEmail: "admin@mrm.io",
          ipAddress: "10.20.4.11",
          ...input,
        };
        set((state) => ({ entries: [entry, ...state.entries] }));
      },
    }),
    { name: "admin-audit-store" }
  )
);
