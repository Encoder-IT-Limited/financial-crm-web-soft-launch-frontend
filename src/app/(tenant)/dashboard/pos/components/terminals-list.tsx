"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { KeyRound, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { can } from "@/lib/permissions";
import { useMe } from "@/hooks/useMe";
import type { PosTerminal } from "../types";
import { posTerminalsApi } from "../api/terminals.service";
import { inventoryApi } from "@/app/(tenant)/modules/inventory/api/inventory.service";
import { TerminalFormDialog } from "./terminal-form-dialog";
import { ManagerPinSettingsDialog } from "./manager-pin-settings-dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

export function TerminalsList() {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const canManage = can(me, "pos.manage");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const { data: terminals = [], isLoading } = useQuery({
    queryKey: ["pos-terminals", statusFilter],
    queryFn: () => posTerminalsApi.list(statusFilter === "all" ? undefined : statusFilter),
  });
  const { data: warehouses = [] } = useQuery({ queryKey: ["pos-warehouses"], queryFn: inventoryApi.listWarehouses });

  const [createOpen, setCreateOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [editing, setEditing] = useState<PosTerminal | null>(null);

  const warehouseName = (id: string) => warehouses.find((w) => w.id === id)?.name ?? id;

  function toggleStatus(terminal: PosTerminal) {
    const next = terminal.status === "active" ? "inactive" : "active";
    posTerminalsApi
      .setStatus(terminal.id, next)
      .then(() => {
        toast.success(`${terminal.name} is now ${next}`);
        queryClient.invalidateQueries({ queryKey: ["pos-terminals"] });
      })
      .catch((err: unknown) => {
        toast.error(err instanceof ApiError ? err.message : "Could not update terminal");
      });
  }

  const columns = useMemo<AnyColumnDef<PosTerminal>[]>(
    () => [
      { accessorKey: "name", header: "Terminal", cell: ({ row }) => <span className="font-bold text-text">{row.original.name}</span> },
      { accessorKey: "code", header: "Code" },
      {
        id: "warehouse",
        header: "Linked Warehouse",
        cell: ({ row }) => warehouseName(row.original.warehouseId),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <Badge tone={row.original.status === "active" ? "green" : "neutral"}>{row.original.status}</Badge>,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(row.original)}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toggleStatus(row.original)}>
              {row.original.status === "active" ? "Deactivate" : "Activate"}
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [warehouses],
  );

  return (
    <div>
      <PageHeading
        title="Terminals"
        subtitle="Every sale through a terminal deducts stock from its linked warehouse"
        actions={
          <>
            {canManage && (
              <Button variant="outline" size="sm" onClick={() => setPinOpen(true)}>
                <KeyRound /> Manager PIN
              </Button>
            )}
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus /> New Terminal
            </Button>
          </>
        }
      />

      <FilterableTable
        columns={columns}
        data={terminals}
        loading={isLoading}
        getRowId={(t) => t.id}
        emptyState="No terminals yet."
        filters={
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter((v ?? "all") as typeof statusFilter)}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All terminals</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        }
        onClearFilters={() => setStatusFilter("all")}
      />

      <TerminalFormDialog key={createOpen ? "create-open" : "create-closed"} terminal={null} open={createOpen} onOpenChange={setCreateOpen} />
      {editing && (
        <TerminalFormDialog
          key={editing.id}
          terminal={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
      <ManagerPinSettingsDialog open={pinOpen} onOpenChange={setPinOpen} />
    </div>
  );
}
