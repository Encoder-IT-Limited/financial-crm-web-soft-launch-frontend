export type TenantUserStatus = "ACTIVE" | "DISABLED" | "INVITED";

export type TenantUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: TenantUserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  inviteId: string | null;
};

export type RoleCatalogEntry = {
  id: string;
  key: string;
  name: string;
  label: string;
  description?: string | null;
  permissions: string[];
  countsTowardSeats: boolean;
  invitable: boolean;
  isSystem: boolean;
  userCount: number;
};

export type PermissionCatalogGroup = {
  key: string;
  label: string;
  wildcard: string;
  permissions: { key: string; label: string }[];
};

export type SeatUsage = {
  used: number;
  total: number;
  message: string;
};

export type InviteCreated = TenantUser & {
  acceptToken?: string;
  acceptUrl?: string;
};

export type InvitePreview = {
  email: string;
  name: string;
  role: string;
  tenantName: string;
};
