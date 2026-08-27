"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { EntityDetailsDialog } from "@/components/shared/entity-details-dialog";
import { fmtDateTime } from "@/lib/format";
import { posSessionsApi } from "../api/sessions.service";
import { posSalesApi } from "../api/sales.service";
import { posTerminalsApi } from "../api/terminals.service";
import { useFmtMoney } from "../use-fmt-money";

export function SessionDetailsDialog({
  sessionId,
  open,
  onOpenChange,
}: {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: session } = useQuery({ queryKey: ["pos-session", sessionId], queryFn: () => posSessionsApi.get(sessionId), enabled: open });
  const { data: sales = [] } = useQuery({ queryKey: ["pos-sales"], queryFn: () => posSalesApi.list(), enabled: open });
  const { data: terminals = [] } = useQuery({ queryKey: ["pos-terminals"], queryFn: () => posTerminalsApi.list(), enabled: open });
  const money = useFmtMoney();

  if (!session) return null;

  const terminal = terminals.find((t) => t.id === session.terminalId);
  const sessionSales = sales.filter((s) => s.sessionId === session.id);
  const cashTotal = sessionSales.reduce((sum, s) => sum + s.payments.filter((p) => p.method === "cash").reduce((a, p) => a + p.amount, 0), 0);

  return (
    <EntityDetailsDialog
      open={open}
      onOpenChange={onOpenChange}
      title={terminal?.name ?? "Session"}
      subtitle={`${session.openedBy} · ${fmtDateTime(session.openedAt)}`}
      statusSlot={<Badge tone={session.status === "open" ? "green" : "neutral"}>{session.status}</Badge>}
    >
      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
        <Stat label="Opening Cash" value={money(session.openingCash)} />
        <Stat label="Cash Sales" value={money(cashTotal)} />
        <Stat label="Expected" value={session.expectedCash !== undefined ? money(session.expectedCash) : "—"} />
        <Stat
          label="Variance"
          value={session.variance !== undefined ? `${session.variance > 0 ? "+" : ""}${money(session.variance)}` : "—"}
        />
      </div>

      <div className="border-t border-border px-5 py-3 text-sm font-bold text-text">Sales this session ({sessionSales.length})</div>
      <div className="flex flex-col divide-y divide-border">
        {sessionSales.map((sale) => (
          <div key={sale.id} className="flex items-center justify-between px-5 py-2.5 text-[12.5px]">
            <span className="font-semibold text-text">{sale.number}</span>
            <span className="text-text-3">{fmtDateTime(sale.createdAt)}</span>
            <span className="font-bold text-text">{money(sale.total)}</span>
          </div>
        ))}
        {sessionSales.length === 0 && <div className="px-5 py-4 text-[12.5px] text-text-4">No sales recorded during this session.</div>}
      </div>
    </EntityDetailsDialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-subtle p-3 text-center">
      <div className="text-[10.5px] font-bold uppercase tracking-wide text-text-3">{label}</div>
      <div className="mt-1 text-[14px] font-extrabold text-text">{value}</div>
    </div>
  );
}
