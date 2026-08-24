"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeading } from "@/components/shared/page-heading";
import { fmtMoney } from "@/lib/format";
import { toast } from "@/lib/toast";
import {
  stockOverview,
  warehouses as initialWarehouses,
  type Warehouse,
  type WarehouseStatus,
} from "../mock-data";
import { WarehousesToolbar } from "./warehouses-toolbar";
import { CapacityBar } from "./capacity-bar";
import { WarehouseDetail } from "./warehouse-detail";
import { StockOverviewTable } from "./stock-overview-table";

const headClass = "text-[11px] font-semibold uppercase tracking-wide text-text-2";

export function WarehousesPage() {
  const [items, setItems] = useState<Warehouse[]>(initialWarehouses);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("all");
  const [status, setStatus] = useState<WarehouseStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialWarehouses[0]?.id ?? null);
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);

  const locations = useMemo(
    () => Array.from(new Set(initialWarehouses.map((w) => w.location))).sort(),
    []
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((w) => {
      if (location !== "all" && w.location !== location) return false;
      if (status !== "all" && w.status !== status) return false;
      if (needle) {
        const haystack = `${w.name} ${w.location} ${w.manager}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [items, search, location, status]);

  const selected = items.find((w) => w.id === selectedId) ?? filtered[0] ?? items[0] ?? null;

  function handleDelete() {
    if (!deleteTarget) return;
    setItems((prev) => prev.filter((w) => w.id !== deleteTarget.id));
    if (selectedId === deleteTarget.id) setSelectedId(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Warehouses"
        subtitle="Manage your warehouses and stock levels"
        actions={
          <Button render={<Link href="/dashboard/warehouses/new" />} nativeButton={false}>
            <Plus data-icon="inline-start" />
            Add Warehouse
          </Button>
        }
      />

      <Card className="flex flex-col gap-4 p-5">
        <WarehousesToolbar
          search={search}
          onSearchChange={setSearch}
          location={location}
          onLocationChange={setLocation}
          status={status}
          onStatusChange={setStatus}
          locations={locations}
        />

        <div className="overflow-x-auto overflow-y-hidden rounded-[10px] border border-border">
          <Table className="whitespace-nowrap text-[12.5px] min-[1440px]:text-[13px]">
            <TableHeader>
              <TableRow className="bg-surface-subtle hover:bg-surface-subtle">
                <TableHead className={`pl-5 ${headClass}`}>Warehouse Name</TableHead>
                <TableHead className={headClass}>Location</TableHead>
                <TableHead className={headClass}>Manager</TableHead>
                <TableHead className={`text-right ${headClass}`}>Total Items</TableHead>
                <TableHead className={`text-right ${headClass}`}>Total Value</TableHead>
                <TableHead className={headClass}>Capacity vs Occupancy</TableHead>
                <TableHead className={headClass}>Status</TableHead>
                <TableHead className={`pr-5 text-right ${headClass}`}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-[13px] text-text-4">
                    No warehouses match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((w) => (
                  <TableRow
                    key={w.id}
                    data-selected={w.id === selected?.id}
                    className={w.id === selected?.id ? "bg-blue-l/60" : undefined}
                  >
                    <TableCell className="py-3 pl-5 font-semibold text-text">{w.name}</TableCell>
                    <TableCell className="py-3 text-text-2">{w.location}</TableCell>
                    <TableCell className="py-3 text-text-2">{w.manager}</TableCell>
                    <TableCell className="py-3 text-right font-semibold tabular-nums text-text">
                      {w.totalItems}
                    </TableCell>
                    <TableCell className="py-3 text-right font-semibold tabular-nums text-text">
                      {fmtMoney(w.totalValue)}
                    </TableCell>
                    <TableCell className="py-3 pr-6">
                      <CapacityBar occupancy={w.occupancy} capacity={w.capacity} />
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge tone={w.status === "active" ? "green" : "neutral"}>
                        {w.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 pr-5">
                      <span className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`View ${w.name}`}
                          onClick={() => setSelectedId(w.id)}
                        >
                          <Eye />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${w.name}`}
                          onClick={() =>
                            toast.info(
                              `Editing ${w.name} will be available once the inventory API is connected`
                            )
                          }
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${w.name}`}
                          className="text-red hover:text-red"
                          onClick={() => setDeleteTarget(w)}
                        >
                          <Trash2 />
                        </Button>
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {selected && <WarehouseDetail warehouse={selected} />}

      <StockOverviewTable rows={stockOverview} warehouses={items} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete warehouse"
        description={`This will permanently remove "${deleteTarget?.name ?? ""}" and its stock records.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        successMessage={`${deleteTarget?.name ?? "Warehouse"} deleted`}
      />
    </div>
  );
}
