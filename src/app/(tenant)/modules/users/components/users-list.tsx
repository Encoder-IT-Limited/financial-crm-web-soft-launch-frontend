"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Mail, Pencil, Plus, UserX } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SeatMeter } from "@/components/shared/seat-meter";
import { useMe } from "@/hooks/useMe";
import { can } from "@/lib/permissions";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { usersApi } from "../api/users.service";
import { usersKeys } from "../query-keys";
import { useUserRoles, useUserSeats, useUsers } from "../hooks/use-users";
import type { TenantUser, TenantUserStatus } from "../types";
import { UserStatusBadge } from "./user-status-badge";
import { InviteUserDialog } from "./invite-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

type Filters = { search: string; status: "all" | TenantUserStatus };

export function UsersList() {
  const queryClient = useQueryClient();
  const { data: me, isPending: mePending } = useMe();
  const canManage = can(me, "user.manage");
  const { data: users = [], isLoading: loading } = useUsers(canManage);
  const { data: roles = [] } = useUserRoles(canManage);
  const { data: seats } = useUserSeats(canManage);
  const [filters, setFilters] = useState<Filters>({ search: "", status: "all" });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<TenantUser | null>(null);
  const [disableUser, setDisableUser] = useState<TenantUser | null>(null);
  const [cancelUser, setCancelUser] = useState<TenantUser | null>(null);

  const roleLabel = useMemo(() => {
    const map = new Map(roles.map((role) => [role.key, role.name ?? role.label]));
    return (key: string) => map.get(key) ?? key;
  }, [roles]);

  const seatsFull = Boolean(seats && seats.total > 0 && seats.used >= seats.total);

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return users.filter((user) => {
      if (filters.status !== "all" && user.status !== filters.status) return false;
      if (needle && !user.name.toLowerCase().includes(needle) && !user.email.toLowerCase().includes(needle)) {
        return false;
      }
      return true;
    });
  }, [users, filters]);

  async function resend(user: TenantUser) {
    if (!user.inviteId) return;
    try {
      const created = await usersApi.resend(user.inviteId);
      await queryClient.invalidateQueries({ queryKey: usersKeys.all });
      if (created.acceptUrl) {
        try {
          await navigator.clipboard.writeText(created.acceptUrl);
        } catch {
          /* clipboard optional */
        }
        toast.success("Invite resent. Accept link copied.");
      } else {
        toast.success(`Invite resent to ${user.email}`);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't resend invite.");
    }
  }

  const columns = useMemo<AnyColumnDef<TenantUser>[]>(
    () => [
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-text">{row.original.name}</div>
            <div className="text-[11px] text-text-4">{row.original.email}</div>
          </div>
        ),
      },
      {
        id: "role",
        header: "Role",
        cell: ({ row }) => <span className="text-[12.5px] text-text-2">{roleLabel(row.original.role)}</span>,
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        size: 120,
        cell: ({ row }) => {
          if (!canManage) return null;
          const user = row.original;
          const isSelf = user.id === me?.id;
          const isOwner = user.role === "OWNER";
          return (
            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              {user.status === "INVITED" && user.inviteId && (
                <Button variant="ghost" size="icon-sm" aria-label="Resend invite" onClick={() => resend(user)}>
                  <Mail />
                </Button>
              )}
              {user.status !== "INVITED" && (
                <Button variant="ghost" size="icon-sm" aria-label="Edit user" onClick={() => setEditUser(user)}>
                  <Pencil />
                </Button>
              )}
              {user.status === "INVITED" && user.inviteId && (
                <Button variant="ghost" size="icon-sm" aria-label="Cancel invite" onClick={() => setCancelUser(user)}>
                  <UserX className="text-red" />
                </Button>
              )}
              {user.status === "ACTIVE" && !isOwner && !isSelf && (
                <Button variant="ghost" size="icon-sm" aria-label="Disable user" onClick={() => setDisableUser(user)}>
                  <UserX className="text-red" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [canManage, me?.id, roleLabel],
  );

  if (mePending) {
    return (
      <div>
        <PageHeading title="Users" subtitle="Invite teammates and assign a role" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div>
        <PageHeading title="Users" subtitle="You don't have permission to manage team members." />
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        title="Users"
        subtitle="Invite teammates and assign a role"
        actions={
          <div className="flex items-center gap-4">
            {seats && <SeatMeter used={seats.used} total={seats.total} />}
            <Button size="sm" onClick={() => setInviteOpen(true)} disabled={seatsFull}>
              <Plus /> Invite user
            </Button>
          </div>
        }
      />

      {seatsFull && seats && (
        <p className="mb-4 rounded-lg border border-amber/30 bg-amber-l px-3 py-2 text-[12.5px] text-amber">
          {seats.message}
        </p>
      )}

      <FilterableTable
        columns={columns}
        data={filtered}
        loading={loading}
        getRowId={(user) => user.id}
        emptyState="No users match your filters."
        search={{
          value: filters.search,
          onChange: (search) => setFilters({ ...filters, search }),
          placeholder: "Search users...",
        }}
        filters={
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: (value ?? "all") as Filters["status"] })}
          >
            <SelectTrigger size="sm">
              <SelectValue>
                {(value: Filters["status"]) => (value === "all" || !value ? "All status" : <UserStatusBadge status={value} />)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="ACTIVE">
                <UserStatusBadge status="ACTIVE" />
              </SelectItem>
              <SelectItem value="INVITED">
                <UserStatusBadge status="INVITED" />
              </SelectItem>
              <SelectItem value="DISABLED">
                <UserStatusBadge status="DISABLED" />
              </SelectItem>
            </SelectContent>
          </Select>
        }
        onClearFilters={() => setFilters({ search: "", status: "all" })}
        mobileCard={(user) => (
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-text">{user.name}</span>
                <span className="text-[11px] text-text-4">{user.email}</span>
              </div>
              <UserStatusBadge status={user.status} />
            </div>
            <div className="text-[12px] text-text-2">{roleLabel(user.role)}</div>
          </div>
        )}
      />

      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        seatsFull={seatsFull}
        seatMessage={seats?.message}
      />

      {editUser && (
        <EditUserDialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)} user={editUser} />
      )}

      {disableUser && (
        <ConfirmDialog
          open={!!disableUser}
          onOpenChange={(open) => !open && setDisableUser(null)}
          title={`Disable ${disableUser.name}?`}
          description="They will no longer be able to sign in. You can re-enable them later by editing their status."
          confirmLabel="Disable user"
          destructive
          onConfirm={async () => {
            await usersApi.update(disableUser.id, { status: "DISABLED" });
            queryClient.invalidateQueries({ queryKey: usersKeys.all });
          }}
          successMessage={`${disableUser.name} disabled`}
        />
      )}

      {cancelUser?.inviteId && (
        <ConfirmDialog
          open={!!cancelUser}
          onOpenChange={(open) => !open && setCancelUser(null)}
          title={`Cancel invite for ${cancelUser.name}?`}
          description="The pending invite will be revoked and this seat will be freed."
          confirmLabel="Cancel invite"
          destructive
          onConfirm={async () => {
            await usersApi.cancel(cancelUser.inviteId!);
            queryClient.invalidateQueries({ queryKey: usersKeys.all });
          }}
          successMessage="Invite cancelled"
        />
      )}
    </div>
  );
}
