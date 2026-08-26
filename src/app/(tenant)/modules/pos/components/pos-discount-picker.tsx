"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fmtMoney } from "@/lib/format";
import type { PosDiscountRule } from "../api/pos.service";

export function PosDiscountPicker({
  open,
  rules,
  onOpenChange,
  onSelect,
  onClear,
}: {
  open: boolean;
  rules: PosDiscountRule[];
  onOpenChange: (open: boolean) => void;
  onSelect: (ruleId: string) => void;
  onClear: () => void;
}) {
  const active = rules.filter((r) => r.active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Apply discount</DialogTitle>
        </DialogHeader>
        {active.length === 0 ? (
          <p className="text-[13px] text-text-3">
            No preset rules yet. Add them from Register setup. Custom amounts require a manager PIN at charge.
          </p>
        ) : (
          <div className="space-y-1.5">
            {active.map((rule) => (
              <button
                key={rule.id}
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2.5 text-left hover:bg-surface-subtle"
                onClick={() => {
                  onSelect(rule.id);
                  onOpenChange(false);
                }}
              >
                <span className="text-[13px] font-semibold text-text">{rule.name}</span>
                <span className="text-[12px] font-bold text-blue">
                  {rule.type === "PERCENTAGE" ? `${Number(rule.value)}%` : fmtMoney(Number(rule.value))}
                </span>
              </button>
            ))}
          </div>
        )}
        <Button variant="outline" onClick={onClear}>
          Remove discount
        </Button>
      </DialogContent>
    </Dialog>
  );
}
