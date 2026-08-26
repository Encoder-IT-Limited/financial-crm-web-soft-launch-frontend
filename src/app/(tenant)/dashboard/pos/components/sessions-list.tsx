"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { fmtDateTime, fmtMoney } from "@/lib/format";
import type { PosSession } from "../types";
import { posSessionsApi } from "../api/sessions.service";
import { posTerminalsApi } from "../api/terminals.service";
import { SessionDetailsDialog } from "./session-details-dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

export function SessionsList() {
  const { data: sessions = [], isLoading } = useQuery({ queryKey: ["pos-sessions"], queryFn: posSessionsApi.list });
  const { data: terminals = [] } = useQuery({ queryKey: ["pos-terminals"], queryFn: posTerminalsApi.list });
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const terminalName = (id: string) => terminals.find((t) => t.id === id)?.name ?? "—";

  const columns = useMemo<AnyColumnDef<PosSession>[]>(
    () => [
      { id: "terminal", header: "Terminal", cell: ({ row }) => <span className="font-bold text-text">{terminalName(row.original.terminalId)}</span> },
      { accessorKey: "openedBy", header: "Cashier" },
      { id: "openedAt", header: "Opened", cell: ({ row }) => fmtDateTime(row.original.openedAt) },
      { id: "closedAt", header: "Closed", cell: ({ row }) => (row.original.closedAt ? fmtDateTime(row.original.closedAt) : "—") },
      {
        id: "variance",
        header: "Variance",
        cell: ({ row }) => {
          const v = row.original.variance;
          if (v === undefined) return "—";
          return <span className={v === 0 ? "text-green" : v > 0 ? "text-blue" : "text-red"}>{v > 0 ? "+" : ""}{fmtMoney(v)}</span>;
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <Badge tone={row.original.status === "open" ? "green" : "neutral"}>{row.original.status}</Badge>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [terminals]
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
        emptyState="No sessions yet."
      />

      {detailsId && <SessionDetailsDialog sessionId={detailsId} open={!!detailsId} onOpenChange={(open) => !open && setDetailsId(null)} />}
    </div>
  );
}
