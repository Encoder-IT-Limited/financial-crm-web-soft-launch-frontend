"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { StatTiles } from "./stat-tiles";
import { fmtMoney } from "@/lib/format";
import { useRetainers } from "../hooks/use-retainers";
import { useCustomers } from "../../crm/hooks/use-customers";
import { retainerDisplayStatus, retainerPercentUsed, type Retainer, type RetainerDisplayStatus } from "../types";
import { RetainerStatusBadge } from "./retainer-status-badge";
import { RetainerFormDialog } from "./retainer-form-dialog";
import { RetainerDetailsDialog } from "./retainer-details-dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

type Filters = { search: string; status: "all" | RetainerDisplayStatus };

const STATUS_OPTIONS: RetainerDisplayStatus[] = ["active", "paused", "expired", "closed"];

export function RetainersList() {
  const { data: retainers = [], isLoading: loading } = useRetainers();
  const { data: customers = [] } = useCustomers();
  const [filters, setFilters] = useState<Filters>({ search: "", status: "all" });

  const [createOpen, setCreateOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return retainers.filter((r) => {
      if (filters.status !== "all" && retainerDisplayStatus(r) !== filters.status) return false;
      if (needle && !`${r.number} ${customerName(r.customerId)}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retainers, filters, customers]);

  const stats = useMemo(() => {
    const active = retainers.filter((r) => retainerDisplayStatus(r) === "active");
    const totalContracted = retainers.reduce((sum, r) => sum + r.contractAmount, 0);
    const totalRemaining = retainers.reduce((sum, r) => sum + r.remainingBalance, 0);
    return { activeCount: active.length, totalContracted, totalRemaining };
  }, [retainers]);

  const columns = useMemo<AnyColumnDef<Retainer>[]>(
    () => [
      { accessorKey: "number", header: "Retainer #", cell: ({ row }) => <span className="font-bold text-text">{row.original.number}</span> },
      {
        id: "customer",
        accessorFn: (r: Retainer) => customerName(r.customerId),
        header: "Customer",
        cell: ({ row }) => customerName(row.original.customerId),
      },
      {
        id: "contractAmount",
        accessorFn: (r: Retainer) => r.contractAmount,
        header: "Contract",
        cell: ({ row }) => fmtMoney(row.original.contractAmount, row.original.currency),
      },
      {
        id: "remainingBalance",
        accessorFn: (r: Retainer) => r.remainingBalance,
        header: "Remaining",
        cell: ({ row }) => {
          const pct = retainerPercentUsed(row.original);
          return (
            <span className={pct >= 100 ? "text-text-3" : "font-semibold text-green"}>
              {fmtMoney(row.original.remainingBalance, row.original.currency)}
            </span>
          );
        },
      },
      {
        id: "billingPeriod",
        header: "Period",
        enableSorting: false,
        cell: ({ row }) => <span className="capitalize text-text-2">{row.original.billingPeriod}</span>,
      },
      {
        id: "status",
        accessorFn: (r: Retainer) => retainerDisplayStatus(r),
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => <RetainerStatusBadge status={retainerDisplayStatus(row.original)} />,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customers]
  );

  return (
    <div>
      <PageHeading
        title="Retainers"
        subtitle="Manage recurring retainer agreements"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus /> New Retainer
          </Button>
        }
      />

      <div className="mb-4">
        <StatTiles
          tiles={[
            { label: "Active Retainers", value: String(stats.activeCount), tone: "green" },
            { label: "Total Contracted", value: fmtMoney(stats.totalContracted), tone: "blue" },
            { label: "Total Remaining", value: fmtMoney(stats.totalRemaining), tone: "amber" },
          ]}
        />
      </div>

      <FilterableTable
        columns={columns}
        data={filtered}
        loading={loading}
        getRowId={(r) => r.id}
        onRowClick={(r) => setDetailsId(r.id)}
        rowClassName="cursor-pointer"
        emptyState="No retainers match your filters."
        search={{ value: filters.search, onChange: (search) => setFilters({ ...filters, search }), placeholder: "Search retainers..." }}
        filters={
          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: (v ?? "all") as Filters["status"] })}>
            <SelectTrigger size="sm">
              <SelectValue>
                {(v: Filters["status"]) => (v === "all" || !v ? "All status" : <RetainerStatusBadge status={v} />)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  <RetainerStatusBadge status={status} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        onClearFilters={() => setFilters({ search: "", status: "all" })}
        mobileCard={(r) => {
          const pct = retainerPercentUsed(r);
          return (
            <div className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-text">{r.number}</span>
                  <span className="text-[12px] text-text-3">{customerName(r.customerId)}</span>
                </div>
                <RetainerStatusBadge status={retainerDisplayStatus(r)} />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
                <span className="text-text-2">{fmtMoney(r.contractAmount, r.currency)} contract</span>
                <span className={pct >= 100 ? "text-text-3" : "font-semibold text-green"}>
                  {fmtMoney(r.remainingBalance, r.currency)} remaining
                </span>
                <span className="capitalize text-text-4">{r.billingPeriod}</span>
              </div>
            </div>
          );
        }}
      />

      <RetainerFormDialog open={createOpen} onOpenChange={setCreateOpen} />

      {detailsId && (
        <RetainerDetailsDialog
          open={!!detailsId}
          onOpenChange={(open) => !open && setDetailsId(null)}
          retainerId={detailsId}
          onEdit={() => {
            setEditId(detailsId);
            setDetailsId(null);
          }}
        />
      )}

      {editId && <RetainerFormDialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)} retainerId={editId} />}
    </div>
  );
}
