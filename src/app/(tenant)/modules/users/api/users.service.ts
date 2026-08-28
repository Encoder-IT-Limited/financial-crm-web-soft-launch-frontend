import { apiGet, apiGetPage, apiSend } from "@/lib/api/envelope";
import type { Me } from "@/types/identity";
import type {
  InviteCreated,
  InvitePreview,
  PermissionCatalogGroup,
  RoleCatalogEntry,
  SeatUsage,
  TenantUser,
} from "../types";

export const usersApi = {
  list: async (): Promise<TenantUser[]> => (await apiGetPage<TenantUser>("/users")).items,
  roles: () => apiGet<RoleCatalogEntry[]>("/users/roles"),
  permissionCatalog: () => apiGet<PermissionCatalogGroup[]>("/users/permission-catalog"),
  createRole: (body: {
    name: string;
    description?: string | null;
    countsTowardSeats?: boolean;
    permissions: string[];
  }) => apiSend<RoleCatalogEntry>("post", "/users/roles", body),
  updateRole: (
    id: string,
    body: { name?: string; description?: string | null; countsTowardSeats?: boolean; permissions?: string[] },
  ) => apiSend<RoleCatalogEntry>("patch", `/users/roles/${id}`, body),
  deleteRole: (id: string) => apiSend<{ deleted: true }>("delete", `/users/roles/${id}`),
  seats: () => apiGet<SeatUsage>("/users/seats"),
  invite: (body: { name: string; email: string; role: string }) =>
    apiSend<InviteCreated>("post", "/users/invites", body),
  resend: (inviteId: string) => apiSend<InviteCreated>("post", `/users/invites/${inviteId}/resend`),
  cancel: (inviteId: string) => apiSend<{ cancelled: true }>("delete", `/users/invites/${inviteId}`),
  update: (id: string, body: { name?: string; role?: string; status?: "ACTIVE" | "DISABLED" }) =>
    apiSend<TenantUser>("patch", `/users/${id}`, body),
  previewInvite: (token: string) => apiGet<InvitePreview>("/auth/invite", { params: { token } }),
  acceptInvite: (body: { token: string; password: string }) => apiSend<Me>("post", "/auth/accept-invite", body),
};
