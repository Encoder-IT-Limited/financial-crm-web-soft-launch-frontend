"use client";

import { useState } from "react";
import { MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PosTerminal } from "../api/pos.service";

export function PosSessionGate({
  terminals,
  onOpen,
  onSetup,
  pending,
}: {
  terminals: PosTerminal[];
  onOpen: (terminalId: string, openingCash: number) => void;
  onSetup: () => void;
  pending?: boolean;
}) {
  const [terminalId, setTerminalId] = useState(terminals[0]?.id ?? "");
  const [cash, setCash] = useState("0");

  return (
    <div className="flex h-full items-center justify-center bg-[linear-gradient(180deg,#0a1628_0%,#0f1f3d_40%,var(--color-background)_40%)] p-6">
      <Card className="w-full max-w-md gap-0 overflow-hidden p-0 shadow-xl">
        <div className="bg-navy px-6 py-5 text-white">
          <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-blue">
            <MonitorSmartphone className="size-5" />
          </div>
          <h1 className="text-[20px] font-extrabold">Open the register</h1>
          <p className="mt-1 text-[13px] text-white/65">Count the float, pick a terminal, and start selling.</p>
        </div>
        <div className="space-y-4 p-6">
          {terminals.length === 0 ? (
            <div className="rounded-xl bg-amber-l p-4 text-[13px] text-amber">
              No registers yet. Create one in setup before opening a session.
            </div>
          ) : (
            <>
              <div>
                <p className="mb-1 text-[11px] font-bold text-text-3">Terminal</p>
                <Select value={terminalId} onValueChange={(v) => setTerminalId(v ?? "")}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Select terminal" />
                  </SelectTrigger>
                  <SelectContent>
                    {terminals.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} · {t.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-bold text-text-3">Opening cash</p>
                <Input
                  inputMode="decimal"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  className="h-11 text-[16px] font-bold tabular-nums"
                />
              </div>
              <Button
                size="lg"
                className="h-11 w-full"
                disabled={pending || !terminalId}
                onClick={() => onOpen(terminalId, Number(cash) || 0)}
              >
                {pending ? "Opening…" : "Start selling"}
              </Button>
            </>
          )}
          <Button variant="outline" className="w-full" onClick={onSetup}>
            Register setup
          </Button>
        </div>
      </Card>
    </div>
  );
}
