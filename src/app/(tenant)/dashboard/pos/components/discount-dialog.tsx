"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import { useTenantCurrency } from "@/lib/use-tenant-currency";
import { ManagerPinDialog } from "./manager-pin-dialog";

type DiscountKind = "standard" | "override";

/** Standard (pre-configured) discounts apply immediately — offline-safe,
 * per the client's offline-capability split. A manual/override amount
 * routes through the manager-PIN gate first (client-confirmed rule). */

export function DiscountDialog({
  open,
  onOpenChange,
  subtotal,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  onApply: (amount: number, managerPin?: string) => void;
}) {
  const currency = useTenantCurrency();
  const standardDiscounts = [
    { label: "No discount", amount: 0 },
    { label: "5% off", percent: 5 },
    { label: "10% off", percent: 10 },
    { label: `${fmtMoney(20, currency)} off`, amount: 20 },
  ];
  const [kind, setKind] = useState<DiscountKind>("standard");
  const [standardIndex, setStandardIndex] = useState("0");
  const [overrideAmount, setOverrideAmount] = useState("");
  const [pinOpen, setPinOpen] = useState(false);

  function reset() {
    setKind("standard");
    setStandardIndex("0");
    setOverrideAmount("");
  }

  function standardAmount(): number {
    const option = standardDiscounts[Number(standardIndex)];
    if (!option) return 0;
    return option.percent ? Math.round(((subtotal * option.percent) / 100) * 100) / 100 : (option.amount ?? 0);
  }

  function applyStandard() {
    onApply(standardAmount());
    onOpenChange(false);
  }

  function requestOverride() {
    const amount = Number(overrideAmount) || 0;
    if (amount <= 0) return;
    setPinOpen(true);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (next) reset(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
            <DialogDescription>Standard discounts apply instantly; a custom amount needs manager approval.</DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Button variant={kind === "standard" ? "default" : "outline"} size="sm" onClick={() => setKind("standard")}>
              Standard
            </Button>
            <Button variant={kind === "override" ? "default" : "outline"} size="sm" onClick={() => setKind("override")}>
              Custom (manager)
            </Button>
          </div>

          {kind === "standard" ? (
            <Select value={standardIndex} onValueChange={(v) => setStandardIndex(v ?? "0")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {standardDiscounts.map((option, i) => (
                  <SelectItem key={option.label} value={String(i)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type="number"
              min={0}
              step="any"
              value={overrideAmount}
              onChange={(e) => setOverrideAmount(e.target.value)}
              placeholder="Custom discount amount"
              className={cn()}
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {kind === "standard" ? (
              <Button onClick={applyStandard}>Apply {fmtMoney(standardAmount(), currency)}</Button>
            ) : (
              <Button onClick={requestOverride} disabled={!(Number(overrideAmount) > 0)}>
                Request Approval
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ManagerPinDialog
        open={pinOpen}
        onOpenChange={setPinOpen}
        title="Approve custom discount"
        description={`Applying a custom discount of ${fmtMoney(Number(overrideAmount) || 0, currency)} needs manager approval.`}
        onApproved={(pin) => {
          onApply(Number(overrideAmount) || 0, pin);
          onOpenChange(false);
        }}
      />
    </>
  );
}
