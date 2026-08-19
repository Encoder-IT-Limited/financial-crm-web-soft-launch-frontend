"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { SeatMeter } from "@/components/shared/seat-meter";
import { StatusBadge, type TenantStatus } from "@/components/shared/status-badge";
import { fmtDate, fmtMoney } from "@/lib/format";
import { usePlansStore } from "../../plans/store/plans-store";
import { tenantsApi } from "../api/tenants.service";
import { seatUsage, tenantMrr, type Tenant } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

type Filters = { search: string; status: "all" | TenantStatus; planId: string };

const STATUS_OPTIONS: TenantStatus[] = ["active", "read-only", "pending-deletion", "cancelled"];

export function TenantsList() {
  const router = useRouter();
  const plans = usePlansStore((state) => state.plans);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ search: "", status: "all", planId: "all" });

  useEffect(() => {
    tenantsApi.list().then((list) => {
      setTenants(list);
      setLoading(false);
    });
  }, []);

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
        cell: ({ row }) => <span className="text-[12.5px] text-text-2">{planName(row.original.planId)}</span>,
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
          return <span className="text-[13px] font-semibold text-text">{fmtMoney(tenantMrr(row.original, plan))}</span>;
        },
      },
      {
        id: "createdAt",
        accessorFn: (t: Tenant) => t.createdAt,
        header: "Created",
        cell: ({ row }) => <span className="text-[12.5px] text-text-3">{fmtDate(row.original.createdAt)}</span>,
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
        onRowClick={(tenant) => router.push(`/admin/tenants/${tenant.id}`)}
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
    </div>
  );
}
