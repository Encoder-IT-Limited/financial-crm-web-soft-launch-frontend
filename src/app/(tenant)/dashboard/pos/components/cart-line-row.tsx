"use client";

import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartLine } from "../types";
import { useFmtMoney } from "../use-fmt-money";

export function CartLineRow({
  line,
  onQuantityChange,
  onRemove,
}: {
  line: CartLine;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const money = useFmtMoney();
  const lineTotal = line.quantity * line.unitPrice - (line.discountAmount ?? 0);

  return (
    <div className="flex items-center gap-2 border-b border-border py-2.5 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-semibold text-text">{line.name}</div>
        <div className="text-[11px] text-text-3">
          {money(line.unitPrice)} {line.discountAmount ? `· −${money(line.discountAmount)} discount` : ""}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onQuantityChange(Math.max(1, line.quantity - 1))}
          aria-label="Decrease quantity"
        >
          <Minus />
        </Button>
        <span className="w-6 text-center text-[12.5px] font-semibold text-text">{line.quantity}</span>
        <Button variant="outline" size="icon-sm" onClick={() => onQuantityChange(line.quantity + 1)} aria-label="Increase quantity">
          <Plus />
        </Button>
      </div>

      {/* w-20, not w-16 — a preventive widen so a 4-digit total with a
          currency symbol doesn't get clipped */}
      <span className="w-20 shrink-0 text-right text-[12.5px] font-bold text-text">{money(lineTotal)}</span>

      <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Remove line" className="shrink-0 text-red">
        <X />
      </Button>
    </div>
  );
}
