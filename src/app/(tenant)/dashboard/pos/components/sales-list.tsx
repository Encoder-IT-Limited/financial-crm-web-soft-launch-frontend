"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { fmtDateTime } from "@/lib/format";
import type { PosSale, PosSaleStatus } from "../types";
import { posSalesApi } from "../api/sales.service";
import { posTerminalsApi } from "../api/terminals.service";
import { customersApi } from "../../../modules/crm/api/customers.service";
import { useFmtMoney } from "../use-fmt-money";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

type Filters = {
  search: string;
  status: "all" | PosSaleStatus;
  terminalId: string;
  customerId: string;
  startDate: string;
  endDate: string;
};

const STATUS_TONE: Record<PosSaleStatus, "green" | "amber" | "red"> = {
  completed: "green",
  "partially-refunded": "amber",
  refunded: "red",
};

const STATUS_FILTER_LABELS: Record<Filters["status"], string> = {
  all: "All status",
  completed: "Completed",
  "partially-refunded": "Partially Refunded",
  refunded: "Refunded",
};

export function SalesList() {
  const router = useRouter();
  const money = useFmtMoney();
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    terminalId: "all",
    customerId: "all",
    startDate: "",
    endDate: "",
  });

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["pos-sales", filters.search, filters.terminalId, filters.customerId, filters.startDate, filters.endDate],
    queryFn: () =>
      posSalesApi.list({
        search: filters.search || undefined,
        terminalId: filters.terminalId === "all" ? undefined : filters.terminalId,
        customerId: filters.customerId === "all" ? undefined : filters.customerId,
        startDate: filters.startDate ? `${filters.startDate}T00:00:00` : undefined,
        endDate: filters.endDate ? `${filters.endDate}T23:59:59` : undefined,
      }),
  });
  const { data: terminals = [] } = useQuery({ queryKey: ["pos-terminals"], queryFn: () => posTerminalsApi.list() });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });

  const terminalName = (id: string) => terminals.find((t) => t.id === id)?.name ?? "—";

  const grouped = useMemo(() => {
    const rows = filters.status === "all" ? sales : sales.filter((s) => s.status === filters.status);
    return [...rows].sort((a, b) => {
      const terminalCmp = terminalName(a.terminalId).localeCompare(terminalName(b.terminalId));
      if (terminalCmp !== 0) return terminalCmp;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, filters.status, terminals]);

  const columns = useMemo<AnyColumnDef<PosSale>[]>(
    () => [
      { accessorKey: "number", header: "Sale #", cell: ({ row }) => <span className="font-bold text-text">{row.original.number}</span> },
      { id: "terminal", header: "Terminal", cell: ({ row }) => terminalName(row.original.terminalId) },
      { id: "createdAt", header: "Date", cell: ({ row }) => fmtDateTime(row.original.createdAt) },
      { id: "total", header: "Total", cell: ({ row }) => money(row.original.total) },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <Badge tone={STATUS_TONE[row.original.status]}>{row.original.status.replace("-", " ")}</Badge>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [terminals, money],
  );

  return (
    <div>
      <PageHeading title="POS Sales" subtitle="Every sale rung up through any terminal — open one to refund/return" />

      <FilterableTable
        columns={columns}
        data={grouped}
        loading={isLoading}
        getRowId={(s) => s.id}
        onRowClick={(s) => router.push(`/dashboard/pos/sales/${s.id}`)}
        rowClassName="cursor-pointer"
        emptyState="No sales match your filters."
        search={{ value: filters.search, onChange: (search) => setFilters({ ...filters, search }), placeholder: "Search sale #..." }}
        filters={
          <>
            <Select value={filters.terminalId} onValueChange={(v) => setFilters({ ...filters, terminalId: v ?? "all" })}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Terminal">
                  {(v: string | null) => (v === "all" || !v ? "All terminals" : (terminals.find((t) => t.id === v)?.name ?? "Terminal"))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All terminals</SelectItem>
                {terminals.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.customerId} onValueChange={(v) => setFilters({ ...filters, customerId: v ?? "all" })}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Customer">
                  {(v: string | null) => (v === "all" || !v ? "All customers" : (customers.find((c) => c.id === v)?.name ?? "Customer"))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All customers</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="h-8 w-[9.5rem]"
              aria-label="From date"
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="h-8 w-[9.5rem]"
              aria-label="To date"
            />
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: (v ?? "all") as Filters["status"] })}>
              <SelectTrigger size="sm">
                <SelectValue>{(v: Filters["status"]) => STATUS_FILTER_LABELS[v] ?? "All status"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="partially-refunded">Partially Refunded</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        onClearFilters={() =>
          setFilters({ search: "", status: "all", terminalId: "all", customerId: "all", startDate: "", endDate: "" })
        }
        mobileCard={(s) => (
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-text">{s.number}</span>
                <span className="text-[11px] text-text-4">{terminalName(s.terminalId)}</span>
              </div>
              <span className="text-[13px] font-semibold text-text">{money(s.total)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Badge tone={STATUS_TONE[s.status]}>{s.status.replace("-", " ")}</Badge>
              <span className="text-[11px] text-text-4">{fmtDateTime(s.createdAt)}</span>
            </div>
          </div>
        )}
      />
    </div>
  );
}
