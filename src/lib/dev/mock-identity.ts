import type { Me } from "@/types/identity";

/**
 * TEMPORARY: stands in for a real /me response until a backend exists.
 * Used only by useMe()'s dev bypass (NODE_ENV !== "production").
 */
export function mockIdentity(realm: "admin" | "tenant"): Me {
  if (realm === "admin") {
    return {
      id: "dev-super-admin",
      name: "Dev Super Admin",
      email: "dev-admin@mrm.local",
      realm: "admin",
      permissions: ["*"],
    };
  }

  return {
    id: "dev-client-admin",
    name: "Dev Client Admin",
    email: "dev-admin@demo-tenant.local",
    realm: "tenant",
    permissions: ["*"],
    tenant: {
      id: "dev-tenant",
      name: "Demo Tenant LLC",
      subdomain: "demo",
      plan: "growth",
      activeModules: [
        "accounting",
        "sales",
        "purchasing",
        "inventory",
        "banking",
        "crm",
        "reports",
        "ai-assistant",
      ],
    },
  };
}
