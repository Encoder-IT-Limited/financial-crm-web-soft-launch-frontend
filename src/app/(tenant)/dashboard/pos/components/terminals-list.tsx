"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { toast } from "@/lib/toast";
import type { PosTerminal } from "../types";
import { posTerminalsApi } from "../api/terminals.service";
import { inventoryApi } from "@/app/(tenant)/modules/inventory/api/inventory.service";
import { TerminalFormDialog } from "./terminal-form-dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

/** Admin config list — same shape/proportion as Inventory's Warehouses
 * list, since a terminal is that kind of entity: set up once, rarely
 * touched, no cashier-facing complexity. */
export function TerminalsList() {
  const queryClient = useQueryClient();
  const { data: terminals = [], isLoading } = useQuery({ queryKey: ["pos-terminals"], queryFn: posTerminalsApi.list });
  const { data: warehouses = [] } = useQuery({ queryKey: ["pos-warehouses"], queryFn: inventoryApi.listWarehouses });

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<PosTerminal | null>(null);

  const warehouseName = (id: string) => warehouses.find((w) => w.id === id)?.name ?? id;

  function toggleStatus(terminal: PosTerminal) {
    const next = terminal.status === "active" ? "inactive" : "active";
    posTerminalsApi.setStatus(terminal.id, next).then(() => {
      toast.success(`${terminal.name} is now ${next}`);
      queryClient.invalidateQueries({ queryKey: ["pos-terminals"] });
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
    []
  );

  return (
    <div>
      <PageHeading
        title="Terminals"
        subtitle="Every sale through a terminal deducts stock from its linked warehouse"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus /> New Terminal
          </Button>
        }
      />

      <FilterableTable columns={columns} data={terminals} loading={isLoading} getRowId={(t) => t.id} emptyState="No terminals yet." />

      <TerminalFormDialog terminal={null} open={createOpen} onOpenChange={setCreateOpen} />
      {editing && <TerminalFormDialog terminal={editing} open={!!editing} onOpenChange={(open) => !open && setEditing(null)} />}
    </div>
  );
}
