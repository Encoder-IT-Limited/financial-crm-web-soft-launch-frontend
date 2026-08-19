import type { Me } from "@/types/identity";

export type ModuleKey =
  | "accounting"
  | "sales"
  | "purchasing"
  | "inventory"
  | "banking"
  | "crm"
  | "reports"
  | "ai-assistant";

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
  return required.some((p) => me.permissions.includes(p));
}

export function hasModule(me: Me | undefined | null, moduleKey: ModuleKey): boolean {
  if (!me) return false;
  if (isPlatform(me)) return true;
  return me.tenant?.activeModules.includes(moduleKey) ?? false;
}
