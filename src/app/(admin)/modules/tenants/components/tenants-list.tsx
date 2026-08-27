"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SeatMeter } from "@/components/shared/seat-meter";
import { StatusBadge, type TenantStatus } from "@/components/shared/status-badge";
import { fmtDate, fmtMoney } from "@/lib/format";
import { planApi } from "../../plans/api/plans.service";
import { tenantsApi, RETENTION_DAYS } from "../api/tenants.service";
import { seatUsage, tenantMrr, type Tenant } from "../types";
import { TenantDetailsDialog } from "./tenant-details-dialog";
import { TenantEditDialog } from "./tenant-edit-dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

type Filters = { search: string; status: "all" | TenantStatus; planId: string };

const STATUS_OPTIONS: TenantStatus[] = ["active", "read-only", "pending-deletion", "cancelled"];

export function TenantsList() {
  const queryClient = useQueryClient();
  const { data: tenants = [], isLoading: loading } = useQuery({ queryKey: ["tenants"], queryFn: tenantsApi.list });
  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: planApi.list });
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>({ search: "", status: "all", planId: "all" });

  // Tri-state row interaction: which tenant (if any) is open in the details
  // modal, the edit modal, or pending a delete confirmation. Closing Edit
  // returns to Details (low-risk, nice to see the result); closing the
  // delete confirm never does — the tenant may no longer exist.
  // Initialized from ?tenant=<id> so Dashboard can deep-link into a specific
  // tenant's details now that there's no dedicated detail route to link to.
  const [detailsId, setDetailsId] = useState<string | null>(() => searchParams.get("tenant"));
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteTenant = tenants.find((t) => t.id === deleteId);

  const planName = (planId: string) => plans.find((p) => p.id === planId)?.name ?? "—";

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return tenants.filter((tenant) => {
      if (filters.status !== "all" && tenant.status !== filters.status) return false;
      if (filters.planId !== "all" && tenant.planId !== filters.planId) return false;
      if (needle && !tenant.name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [tenants, filters]);

  const columns = useMemo<AnyColumnDef<Tenant>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Tenant",
        cell: ({ row }) => <span className="font-bold text-text">{row.original.name}</span>,
      },
      {
        id: "plan",
        accessorFn: (t: Tenant) => planName(t.planId),
        header: "Plan",
        cell: ({ row }) => (
          <span className="text-[12.5px] text-text-2 min-[1440px]:text-[13.5px]">{planName(row.original.planId)}</span>
        ),
      },
      {
        id: "seats",
        header: "Seats",
        enableSorting: false,
        cell: ({ row }) => {
          const plan = plans.find((p) => p.id === row.original.planId);
          const { used, total } = seatUsage(row.original, plan);
          return <SeatMeter used={used} total={total} />;
        },
      },
      {
        id: "status",
        accessorFn: (t: Tenant) => t.status,
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "mrr",
        header: "MRR",
        cell: ({ row }) => {
          const plan = plans.find((p) => p.id === row.original.planId);
          return (
            <span className="text-[13px] font-semibold text-text min-[1440px]:text-[14px]">
              {fmtMoney(tenantMrr(row.original, plan))}
            </span>
          );
        },
      },
      {
        id: "createdAt",
        accessorFn: (t: Tenant) => t.createdAt,
        header: "Created",
        cell: ({ row }) => (
          <span className="text-[12.5px] text-text-3 min-[1440px]:text-[13.5px]">{fmtDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        size: 90,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-sm" aria-label="Edit tenant" onClick={() => setEditId(row.original.id)}>
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete tenant"
              onClick={() => setDeleteId(row.original.id)}
            >
              <Trash2 className="text-red" />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plans]
  );

  return (
    <div>
      <PageHeading title="All Clients" subtitle="Manage every tenant account on the platform" />

      <FilterableTable
        columns={columns}
        data={filtered}
        loading={loading}
        getRowId={(tenant) => tenant.id}
        onRowClick={(tenant) => setDetailsId(tenant.id)}
        rowClassName="cursor-pointer"
        emptyState="No tenants match your filters."
        search={{ value: filters.search, onChange: (search) => setFilters({ ...filters, search }), placeholder: "Search tenants..." }}
        filters={
          <>
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: (v ?? "all") as Filters["status"] })}>
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    <StatusBadge status={status} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.planId} onValueChange={(v) => setFilters({ ...filters, planId: v ?? "all" })}>
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        onClearFilters={() => setFilters({ search: "", status: "all", planId: "all" })}
      />

      {detailsId && (
        <TenantDetailsDialog
          open={!!detailsId}
          onOpenChange={(open) => !open && setDetailsId(null)}
          tenantId={detailsId}
          onEdit={() => {
            setEditId(detailsId);
            setDetailsId(null);
          }}
          onDelete={() => {
            setDeleteId(detailsId);
            setDetailsId(null);
          }}
        />
      )}

      {editId && (
        <TenantEditDialog
          open={!!editId}
          onOpenChange={(open) => !open && setEditId(null)}
          tenantId={editId}
        />
      )}

      {deleteTenant && (
        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title={`Delete ${deleteTenant.name}?`}
          description={`This marks the tenant for deletion. The account stays recoverable for ${RETENTION_DAYS} days, then data is removed. You can reactivate it from the tenant details while it is pending deletion.`}
          confirmLabel="Delete tenant"
          destructive
          onConfirm={async () => {
            await tenantsApi.delete(deleteTenant.id);
            queryClient.invalidateQueries({ queryKey: ["tenants"] });
            queryClient.invalidateQueries({ queryKey: ["audit"] });
          }}
          successMessage={`${deleteTenant.name} deleted`}
        />
      )}
    </div>
  );
}
