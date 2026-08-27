import { apiGet, apiGetPage } from "@/lib/api/envelope";
import type { AuditAction, AuditLogEntry } from "../types";

type NewAuditLogInput = Omit<AuditLogEntry, "id" | "timestamp" | "userName" | "userEmail" | "ipAddress">;

export type AuditListParams = {
  tenantId?: string;
  module?: string;
  action?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

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
  list: async (params?: Omit<AuditListParams, "page" | "pageSize">): Promise<AuditLogEntry[]> =>
    (await apiGet<AuditLogEntry[]>("/admin/audit", { params })).map(toEntry),

  listPage: async (params: AuditListParams) => {
    const page = await apiGetPage<AuditLogEntry>("/admin/audit", params);
    return { ...page, items: page.items.map(toEntry) };
  },

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
