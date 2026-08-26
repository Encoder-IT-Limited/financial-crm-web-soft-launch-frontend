import type { Me } from "@/types/identity";

export type ModuleKey =
  | "accounting"
  | "sales"
  | "purchasing"
  | "inventory"
  | "banking"
  | "crm"
  | "reports"
  | "ai-assistant"
  // Phase 2/3 modules — not built yet, but plans can gate them ahead of time
  // (docs/Public-SuperAdmin-Plan.md §3.8).
  | "pos"
  | "hr-payroll"
  | "calendar-booking"
  | "social-media";

export const MODULE_LABELS: Record<ModuleKey, string> = {
  accounting: "Accounting",
  sales: "Sales",
  purchasing: "Purchasing",
  inventory: "Inventory",
  banking: "Banking",
  crm: "CRM",
  reports: "Reports & Compliance",
  "ai-assistant": "AI Assistant",
  pos: "POS",
  "hr-payroll": "HR & Payroll",
  "calendar-booking": "Calendar & Booking",
  "social-media": "Social Media",
};

export function isPlatform(me: Me | undefined | null): boolean {
  return me?.realm === "admin";
}

export function isTenant(me: Me | undefined | null): boolean {
  return me?.realm === "tenant";
}

/** Grants access if the user holds any one of the given permissions. */
export function can(me: Me | undefined | null, permission: string | string[]): boolean {
  if (!me) return false;
  if (isPlatform(me)) return true;
  const required = Array.isArray(permission) ? permission : [permission];
  return required.some((p) => permissionAllowed(me.permissions, p));
}

function permissionAllowed(granted: string[], required: string): boolean {
  for (const grant of granted) {
    if (grant === "*") return true;
    if (grant === required) return true;
    if (grant.endsWith(".*")) {
      const prefix = grant.slice(0, -2);
      if (required === prefix || required.startsWith(`${prefix}.`)) return true;
    }
    if (grant.startsWith("*.")) {
      const suffix = grant.slice(1);
      if (required.endsWith(suffix)) return true;
    }
  }
  return false;
}

export function hasModule(me: Me | undefined | null, moduleKey: ModuleKey): boolean {
  if (!me) return false;
  if (isPlatform(me)) return true;
  return me.tenant?.activeModules.includes(moduleKey) ?? false;
}
