import { apiGet, apiSend } from "@/lib/api/envelope";
import type { AuditAction, AuditLogEntry } from "../types";

type NewAuditLogInput = Omit<AuditLogEntry, "id" | "timestamp" | "userName" | "userEmail" | "ipAddress">;

function toEntry(row: AuditLogEntry): AuditLogEntry {
  return {
    ...row,
    action: row.action as AuditAction,
    tenantId: row.tenantId ?? null,
    tenantName: row.tenantName ?? null,
    oldValues: row.oldValues ?? null,
    newValues: row.newValues ?? null,
    ipAddress: row.ipAddress ?? "",
  };
}

export const auditApi = {
  list: async (): Promise<AuditLogEntry[]> => (await apiGet<AuditLogEntry[]>("/admin/audit")).map(toEntry),

  listForTenant: async (tenantId: string): Promise<AuditLogEntry[]> =>
    (await apiGet<AuditLogEntry[]>("/admin/audit", { params: { tenantId } })).map(toEntry),

  /** Backend writes audit rows on mutations — kept as a no-op so call sites
   * that still invoke it after local UI actions don't break. */
  logEntry: async (input: NewAuditLogInput): Promise<AuditLogEntry> => ({
    id: "local",
    timestamp: new Date().toISOString(),
    userName: "",
    userEmail: "",
    ipAddress: "",
    ...input,
  }),
};
