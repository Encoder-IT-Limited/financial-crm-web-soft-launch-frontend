"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { tenantsApi } from "../../tenants/api/tenants.service";
import { auditApi } from "../api/audit.service";
import { AuditLogRow } from "./audit-log-row";
import type { AuditAction, AuditLogEntry } from "../types";
import { AUDIT_ACTION_LABELS } from "../types";

type Filters = {
  search: string;
  tenantId: string;
  module: string;
  action: "all" | AuditAction;
  from: string;
  to: string;
};

const EMPTY_FILTERS: Filters = { search: "", tenantId: "all", module: "all", action: "all", from: "", to: "" };
const AUDIT_MODULES = ["Tenants", "Plans & Pricing", "Payments", "Settings"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

export function AuditLogList() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });

  const { data: tenants = [] } = useQuery({ queryKey: ["tenants"], queryFn: tenantsApi.list });
  const { data, isLoading: loading } = useQuery({
    queryKey: ["audit", filters, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      auditApi.listPage({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        tenantId: filters.tenantId === "all" ? undefined : filters.tenantId,
        module: filters.module === "all" ? undefined : filters.module,
        action: filters.action === "all" ? undefined : filters.action,
        q: filters.search.trim() || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      }),
  });

  const entries = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  function patchFilters(patch: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  const columns = useMemo<AnyColumnDef<AuditLogEntry>[]>(
    () => [
      {
        id: "entry",
        header: "Event",
        enableSorting: false,
        cell: ({ row }) => <AuditLogRow entry={row.original} />,
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeading title="Audit Log" subtitle="Review platform activity across all tenants" />

      <FilterableTable
        columns={columns}
        data={entries}
        loading={loading}
        getRowId={(e) => e.id}
        emptyState="No activity matches your filters."
        cardClassName="gap-0 overflow-hidden p-0"
        search={{
          value: filters.search,
          onChange: (search) => patchFilters({ search }),
          placeholder: "Search entity, user, tenant...",
        }}
        filters={
          <>
            <Select value={filters.tenantId} onValueChange={(v) => patchFilters({ tenantId: v ?? "all" })}>
              <SelectTrigger size="sm">
                <SelectValue>
                  {(v: string | null) => (v === "all" || !v ? "All tenants" : (tenants.find((t) => t.id === v)?.name ?? "All tenants"))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tenants</SelectItem>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.module} onValueChange={(v) => patchFilters({ module: v ?? "all" })}>
              <SelectTrigger size="sm">
                <SelectValue>{(v: string | null) => (v === "all" || !v ? "All modules" : v)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                {AUDIT_MODULES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.action}
              onValueChange={(v) => patchFilters({ action: (v ?? "all") as Filters["action"] })}
            >
              <SelectTrigger size="sm">
                <SelectValue>
                  {(v: Filters["action"]) => (v === "all" || !v ? "All actions" : (AUDIT_ACTION_LABELS[v] ?? "All actions"))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {(Object.keys(AUDIT_ACTION_LABELS) as AuditAction[]).map((action) => (
                  <SelectItem key={action} value={action}>
                    {AUDIT_ACTION_LABELS[action]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => patchFilters({ from: e.target.value })}
              className="w-[140px]"
              aria-label="From date"
            />
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => patchFilters({ to: e.target.value })}
              className="w-[140px]"
              aria-label="To date"
            />
          </>
        }
        onClearFilters={() => {
          setFilters(EMPTY_FILTERS);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        manualPagination
        pageCount={pageCount}
        totalCount={total}
        initialPageSize={25}
        onPaginationChange={setPagination}
      />
    </div>
  );
}
