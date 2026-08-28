import { apiGet, apiSend } from "@/lib/api/envelope";
import type { TenantStatus } from "@/components/shared/status-badge";
import type { TenantEditValues, TenantCreateValues } from "../schemas";
import type { BillingCycle, Tenant, TenantUser, TenantUserRole } from "../types";

type ApiTenantUser = { id: string; name: string; email: string; role: string };

type ApiTenant = {
  id: string;
  name: string;
  legalName: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  planId: string | null;
  status: string;
  billingCycle: string;
  extraSeatsPurchased: number;
  createdAt: string;
  renewalDate: string | null;
  pendingDeletionAt?: string | null;
  users?: ApiTenantUser[];
  seats?: { used: number; total: number };
};

function mapRole(role: string): TenantUserRole {
  switch (role.toUpperCase()) {
    case "OWNER":
      return "owner";
    case "ADMIN":
      return "admin";
    case "MANAGER":
      return "manager";
    case "INVENTORY_MANAGER":
      return "inventory-manager";
    case "SALES_CASHIER":
      return "pos-cashier";
    case "ACCOUNTANT":
      return "accountant";
    case "VIEWER":
      return "read-only-auditor";
    default:
      return "staff";
  }
}

function mapTenant(row: ApiTenant): Tenant {
  const users: TenantUser[] = (row.users ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: mapRole(u.role),
  }));

  return {
    id: row.id,
    name: row.name,
    legalName: row.legalName ?? row.name,
    email: row.email,
    phone: row.phone ?? "",
    address: row.address ?? "",
    planId: row.planId ?? "",
    status: row.status as TenantStatus,
    billingCycle: (row.billingCycle === "yearly" ? "yearly" : "monthly") as BillingCycle,
    extraSeatsPurchased: row.extraSeatsPurchased ?? 0,
    createdAt: row.createdAt,
    renewalDate: row.renewalDate ?? row.createdAt,
    pendingDeletionAt: row.pendingDeletionAt ?? undefined,
    users,
  };
}

export const RETENTION_DAYS = 60;

export const tenantsApi = {
  list: async (): Promise<Tenant[]> => (await apiGet<ApiTenant[]>("/admin/tenants")).map(mapTenant),

  get: async (id: string): Promise<Tenant | undefined> => {
    try {
      return mapTenant(await apiGet<ApiTenant>(`/admin/tenants/${id}`));
    } catch {
      return undefined;
    }
  },

  create: async (input: TenantCreateValues): Promise<Tenant> =>
    mapTenant(
      await apiSend<ApiTenant>("post", "/admin/tenants", {
        name: input.name,
        subdomain: input.subdomain,
        ownerName: input.ownerName,
        ownerEmail: input.ownerEmail,
        ownerPassword: input.ownerPassword,
        legalName: input.legalName || undefined,
        country: input.country || undefined,
        planId: input.planId || undefined,
        billingCycle: input.billingCycle,
      }),
    ),

  suspend: async (id: string): Promise<void> => {
    await apiSend("post", `/admin/tenants/${id}/suspend`);
  },

  reactivate: async (id: string): Promise<void> => {
    await apiSend("post", `/admin/tenants/${id}/reactivate`);
  },

  addSeats: async (id: string, count: number): Promise<void> => {
    await apiSend("post", `/admin/tenants/${id}/seats`, { count });
  },

  removeSeats: async (id: string, count: number): Promise<void> => {
    await apiSend("post", `/admin/tenants/${id}/seats/remove`, { count });
  },

  cancel: async (id: string): Promise<void> => {
    await apiSend("post", `/admin/tenants/${id}/cancel`);
  },

  update: async (id: string, input: TenantEditValues): Promise<void> => {
    const current = await tenantsApi.get(id);
    await apiSend("patch", `/admin/tenants/${id}`, {
      name: input.name,
      legalName: input.legalName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      planId: input.planId || undefined,
      billingCycle: input.billingCycle,
    });

    if (current && input.extraSeatsPurchased > current.extraSeatsPurchased) {
      await tenantsApi.addSeats(id, input.extraSeatsPurchased - current.extraSeatsPurchased);
    } else if (current && input.extraSeatsPurchased < current.extraSeatsPurchased) {
      await tenantsApi.removeSeats(id, current.extraSeatsPurchased - input.extraSeatsPurchased);
    }

    if (current && input.status !== current.status) {
      if (input.status === "read-only") await tenantsApi.suspend(id);
      else if (input.status === "active") await tenantsApi.reactivate(id);
      else if (input.status === "pending-deletion") {
        await apiSend("post", `/admin/tenants/${id}/pending-deletion`);
      } else if (input.status === "cancelled") {
        await tenantsApi.cancel(id);
      }
    }
  },

  delete: async (id: string): Promise<void> => {
    await apiSend("post", `/admin/tenants/${id}/pending-deletion`);
  },
};
