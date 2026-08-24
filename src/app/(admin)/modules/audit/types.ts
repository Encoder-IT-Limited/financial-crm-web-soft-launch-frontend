/* ------------------------------------------------------------------ */
/* Platform-wide audit log — domain model. Frontend-only mock of the   */
/* audit_logs schema (docs/plans/Public-SuperAdmin-Plan.md §3.4/§3.8). */
/* ------------------------------------------------------------------ */

export type AuditAction = "create" | "update" | "delete" | "suspend" | "reactivate" | "login" | "export";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  suspend: "Suspended",
  reactivate: "Reactivated",
  login: "Logged in",
  export: "Exported",
};

export type AuditLogEntry = {
  id: string;
  timestamp: string; // ISO
  userName: string;
  userEmail: string;
  tenantId: string | null; // null = platform-level action (e.g. a plan edit)
  tenantName: string | null;
  module: string; // e.g. "Tenants", "Plans & Pricing", "Payments"
  entity: string; // e.g. "Tenant", "Plan", "Invoice"
  entityLabel: string; // human label, e.g. the tenant/plan name affected
  action: AuditAction;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string;
};
