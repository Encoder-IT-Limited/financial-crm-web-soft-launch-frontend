"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { fmtDateTime, fmtMoney } from "@/lib/format";
import type { PosSale, PosSaleStatus } from "../types";
import { posSalesApi } from "../api/sales.service";
import { posTerminalsApi } from "../api/terminals.service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

type Filters = { search: string; status: "all" | PosSaleStatus };

const STATUS_TONE: Record<PosSaleStatus, "green" | "amber" | "red"> = {
  completed: "green",
  "partially-refunded": "amber",
  refunded: "red",
};

export function SalesList() {
  const router = useRouter();
  const { data: sales = [], isLoading } = useQuery({ queryKey: ["pos-sales"], queryFn: posSalesApi.list });
  const { data: terminals = [] } = useQuery({ queryKey: ["pos-terminals"], queryFn: posTerminalsApi.list });
  const [filters, setFilters] = useState<Filters>({ search: "", status: "all" });

  const terminalName = (id: string) => terminals.find((t) => t.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return sales.filter((s) => {
      if (filters.status !== "all" && s.status !== filters.status) return false;
      if (needle && !s.number.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [sales, filters]);

  const columns = useMemo<AnyColumnDef<PosSale>[]>(
    () => [
      { accessorKey: "number", header: "Sale #", cell: ({ row }) => <span className="font-bold text-text">{row.original.number}</span> },
      { id: "terminal", header: "Terminal", cell: ({ row }) => terminalName(row.original.terminalId) },
      { id: "createdAt", header: "Date", cell: ({ row }) => fmtDateTime(row.original.createdAt) },
      { id: "total", header: "Total", cell: ({ row }) => fmtMoney(row.original.total) },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <Badge tone={STATUS_TONE[row.original.status]}>{row.original.status.replace("-", " ")}</Badge>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [terminals]
  );

  return (
    <div>
      <PageHeading title="POS Sales" subtitle="Every sale rung up through any terminal — open one to refund/return" />

      <FilterableTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        getRowId={(s) => s.id}
        onRowClick={(s) => router.push(`/dashboard/pos/sales/${s.id}`)}
        rowClassName="cursor-pointer"
        emptyState="No sales match your filters."
        search={{ value: filters.search, onChange: (search) => setFilters({ ...filters, search }), placeholder: "Search sale #..." }}
        filters={
          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: (v ?? "all") as Filters["status"] })}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="partially-refunded">Partially Refunded</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        }
        onClearFilters={() => setFilters({ search: "", status: "all" })}
      />
    </div>
  );
}
