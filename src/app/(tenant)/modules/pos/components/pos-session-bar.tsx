"use client";

import { Clock3, Settings2, ReceiptText, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/format";
import type { PosSession, PosTerminal } from "../api/pos.service";

export function PosSessionBar({
  terminal,
  session,
  cashierName,
  onSales,
  onSetup,
  onClose,
}: {
  terminal: PosTerminal | undefined;
  session: PosSession | undefined;
  cashierName?: string;
  onSales: () => void;
  onSetup: () => void;
  onClose: () => void;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-navy px-3 text-white">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-extrabold">{terminal?.name ?? "POS"}</p>
          <Badge tone="green" className="bg-green/20 text-green-t">
            Live
          </Badge>
        </div>
        <p className="flex items-center gap-1 truncate text-[10.5px] text-white/60">
          <Clock3 className="size-3" />
          {session?.openedAt ? fmtDateTime(session.openedAt) : "Session"}
          {cashierName ? ` · ${cashierName}` : ""}
        </p>
      </div>
      <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white" onClick={onSales}>
        <ReceiptText /> Sales
      </Button>
      <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white" onClick={onSetup}>
        <Settings2 /> Setup
      </Button>
      <Button variant="ghost" size="sm" className="text-amber-t hover:bg-white/10 hover:text-white" onClick={onClose}>
        <LogOut /> Close
      </Button>
    </header>
  );
}
