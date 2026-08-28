"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { fmtDateTime } from "@/lib/format";
import type { PosSession } from "../types";
import { posSessionsApi } from "../api/sessions.service";
import { posTerminalsApi } from "../api/terminals.service";
import { SessionDetailsDialog } from "./session-details-dialog";
import { useFmtMoney } from "../use-fmt-money";
import { useCashierDisplay } from "../use-cashier-display";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

type Filters = {
  status: "all" | "open" | "closed";
  terminalId: string;
  startDate: string;
  endDate: string;
};

const STATUS_FILTER_LABELS: Record<Filters["status"], string> = {
  all: "All status",
  open: "Open",
  closed: "Closed",
};

export function SessionsList() {
  const money = useFmtMoney();
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    terminalId: "all",
    startDate: "",
    endDate: "",
  });
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["pos-sessions", filters],
    queryFn: () =>
      posSessionsApi.list({
        status: filters.status === "all" ? undefined : filters.status,
        terminalId: filters.terminalId === "all" ? undefined : filters.terminalId,
        startDate: filters.startDate ? `${filters.startDate}T00:00:00` : undefined,
        endDate: filters.endDate ? `${filters.endDate}T23:59:59` : undefined,
      }),
  });
  const { data: terminals = [] } = useQuery({ queryKey: ["pos-terminals"], queryFn: () => posTerminalsApi.list() });
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const terminalName = (id: string) => terminals.find((t) => t.id === id)?.name ?? "—";

  const columns = useMemo<AnyColumnDef<PosSession>[]>(
    () => [
      { id: "terminal", header: "Terminal", cell: ({ row }) => <span className="font-bold text-text">{terminalName(row.original.terminalId)}</span> },
      { id: "cashier", header: "Cashier", cell: ({ row }) => <CashierCell session={row.original} /> },
      { id: "openedAt", header: "Opened", cell: ({ row }) => fmtDateTime(row.original.openedAt) },
      { id: "closedAt", header: "Closed", cell: ({ row }) => (row.original.closedAt ? fmtDateTime(row.original.closedAt) : "—") },
      {
        id: "variance",
        header: "Variance",
        cell: ({ row }) => {
          const v = row.original.variance;
          if (v === undefined) return "—";
          return <span className={v === 0 ? "text-green" : v > 0 ? "text-blue" : "text-red"}>{v > 0 ? "+" : ""}{money(v)}</span>;
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <Badge tone={row.original.status === "open" ? "green" : "neutral"}>{row.original.status}</Badge>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [terminals, money],
  );

  return (
    <div>
      <PageHeading title="Sessions" subtitle="Every shift's open/close cycle, with cash reconciliation" />

      <FilterableTable
        columns={columns}
        data={sessions}
        loading={isLoading}
        getRowId={(s) => s.id}
        onRowClick={(s) => setDetailsId(s.id)}
        rowClassName="cursor-pointer"
        emptyState="No sessions match your filters."
        filters={
          <>
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: (v ?? "all") as Filters["status"] })}>
              <SelectTrigger size="sm">
                <SelectValue>{(v: Filters["status"]) => STATUS_FILTER_LABELS[v] ?? "All status"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
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
          </>
        }
        onClearFilters={() => setFilters({ status: "all", terminalId: "all", startDate: "", endDate: "" })}
        mobileCard={(s) => (
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-text">{terminalName(s.terminalId)}</span>
                <CashierCell session={s} />
              </div>
              <Badge tone={s.status === "open" ? "green" : "neutral"}>{s.status}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-text-4">
              <span>Opened {fmtDateTime(s.openedAt)}</span>
              <span>Closed {s.closedAt ? fmtDateTime(s.closedAt) : "—"}</span>
              {s.variance !== undefined && (
                <span className={s.variance === 0 ? "text-green" : s.variance > 0 ? "text-blue" : "text-red"}>
                  {s.variance > 0 ? "+" : ""}
                  {money(s.variance)} variance
                </span>
              )}
            </div>
          </div>
        )}
      />

      {detailsId && <SessionDetailsDialog sessionId={detailsId} open={!!detailsId} onOpenChange={(open) => !open && setDetailsId(null)} />}
    </div>
  );
}

function CashierCell({ session }: { session: PosSession }) {
  const { name, verified } = useCashierDisplay(session);
  return (
    <span title={verified ? "Verified — matches the logged-in account" : "Unverified — free text typed at Start Shift"}>
      {name}
      {!verified && <span className="ml-1 text-[10px] text-text-4">(unverified)</span>}
    </span>
  );
}
