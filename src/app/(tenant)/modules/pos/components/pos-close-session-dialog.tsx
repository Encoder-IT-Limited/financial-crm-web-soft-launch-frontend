"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fmtMoney } from "@/lib/format";
import type { PosSession } from "../api/pos.service";

export function PosCloseSessionDialog({
  open,
  session,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  session: PosSession | null;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (closingCash: number) => void;
}) {
  const [cash, setCash] = useState("");
  const counted = Number(cash);
  const expected = session ? Number(session.openingCash) : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setCash("");
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Close register</DialogTitle>
          <DialogDescription>
            Count the drawer. Opening float was {fmtMoney(Number(session?.openingCash ?? 0))}. Expected cash
            updates after posting — enter the physical count.
          </DialogDescription>
        </DialogHeader>
        <div>
          <p className="mb-1 text-[11px] font-bold text-text-3">Counted cash</p>
          <Input
            inputMode="decimal"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
            className="h-11 text-[16px] font-bold tabular-nums"
            placeholder="0.00"
          />
        </div>
        {Number.isFinite(counted) && cash !== "" && (
          <p className={`text-[12.5px] font-semibold ${counted === expected ? "text-text-3" : "text-amber"}`}>
            Difference vs opening float: {fmtMoney(counted - expected)} (final variance uses cash sales too)
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Stay open
          </Button>
          <Button
            disabled={pending || !Number.isFinite(counted) || counted < 0 || cash === ""}
            onClick={() => onConfirm(counted)}
          >
            {pending ? "Closing…" : "Close session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
