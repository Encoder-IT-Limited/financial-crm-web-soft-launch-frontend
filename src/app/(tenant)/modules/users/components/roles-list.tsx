"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useMe } from "@/hooks/useMe";
import { can } from "@/lib/permissions";
import { usersApi } from "../api/users.service";
import { usersKeys } from "../query-keys";
import { useUserRoles } from "../hooks/use-users";
import type { RoleCatalogEntry } from "../types";
import { RoleFormDialog } from "./role-form-dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

export function RolesList() {
  const queryClient = useQueryClient();
  const { data: me, isPending: mePending } = useMe();
  const canManage = can(me, "user.manage");
  const { data: roles = [], isLoading: loading } = useUserRoles(canManage);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<RoleCatalogEntry | null>(null);
  const [deleteRole, setDeleteRole] = useState<RoleCatalogEntry | null>(null);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return roles;
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(needle) ||
        role.key.toLowerCase().includes(needle) ||
        (role.description ?? "").toLowerCase().includes(needle),
    );
  }, [roles, search]);

  const columns = useMemo<AnyColumnDef<RoleCatalogEntry>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Role",
        cell: ({ row }) => (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-text">{row.original.name}</span>
              {row.original.isSystem && <Badge tone="blue">System</Badge>}
            </div>
            {row.original.description ? (
              <div className="text-[11px] text-text-4">{row.original.description}</div>
            ) : (
              <div className="text-[11px] text-text-4">{row.original.key}</div>
            )}
          </div>
        ),
      },
      {
        id: "users",
        header: "Users",
        cell: ({ row }) => <span className="text-[12.5px] text-text-2">{row.original.userCount}</span>,
      },
      {
        id: "seats",
        header: "Seats",
        cell: ({ row }) => (
          <span className="text-[12.5px] text-text-2">{row.original.countsTowardSeats ? "Counts" : "Free"}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        size: 96,
        cell: ({ row }) => {
          if (!canManage) return null;
          const role = row.original;
          return (
            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon-sm" aria-label="Edit role" onClick={() => setEditRole(role)}>
                <Pencil />
              </Button>
              {!role.isSystem && (
                <Button variant="ghost" size="icon-sm" aria-label="Delete role" onClick={() => setDeleteRole(role)}>
                  <Trash2 className="text-red" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [canManage],
  );

  if (mePending) {
    return (
      <div>
        <PageHeading title="Roles" subtitle="Define what each role can do" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div>
        <PageHeading title="Roles" subtitle="You don't have permission to manage roles." />
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        title="Roles"
        subtitle="Create custom roles and choose their permissions"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus /> Create role
          </Button>
        }
      />

      <FilterableTable
        columns={columns}
        data={filtered}
        loading={loading}
        getRowId={(role) => role.id}
        emptyState="No roles match your filters."
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search roles...",
        }}
        onRowClick={(role) => setEditRole(role)}
        mobileCard={(role) => (
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="font-bold text-text">{role.name}</span>
              {role.isSystem && <Badge tone="blue">System</Badge>}
            </div>
            <div className="text-[12px] text-text-2">
              {role.userCount} user{role.userCount === 1 ? "" : "s"} · {role.countsTowardSeats ? "Counts toward seats" : "Does not occupy a seat"}
            </div>
          </div>
        )}
      />

      <RoleFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editRole && (
        <RoleFormDialog open={!!editRole} onOpenChange={(open) => !open && setEditRole(null)} role={editRole} />
      )}

      {deleteRole && (
        <ConfirmDialog
          open={!!deleteRole}
          onOpenChange={(open) => !open && setDeleteRole(null)}
          title={`Delete ${deleteRole.name}?`}
          description={
            deleteRole.userCount > 0
              ? "Reassign users with this role before deleting it."
              : "This custom role will be removed. You can create it again later."
          }
          confirmLabel="Delete role"
          destructive
          onConfirm={async () => {
            await usersApi.deleteRole(deleteRole.id);
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: usersKeys.all }),
              queryClient.invalidateQueries({ queryKey: ["me"] }),
            ]);
          }}
          successMessage={`${deleteRole.name} deleted`}
        />
      )}
    </div>
  );
}
