"use client";

import { Minus, Plus, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtMoney } from "@/lib/format";
import type { CartLine } from "../lib/pos-pricing";
import { priceLine } from "../lib/pos-pricing";
import type { PosDiscountRule } from "../api/pos.service";

export function PosCartLineRow({
  line,
  rule,
  onQty,
  onRemove,
  onPickRule,
  disabled,
}: {
  line: CartLine;
  rule?: PosDiscountRule | null;
  onQty: (qty: number) => void;
  onRemove: () => void;
  onPickRule: () => void;
  disabled?: boolean;
}) {
  const priced = priceLine(
    line,
    rule ? { type: rule.type, value: Number(rule.value) } : null,
  );

  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-text">{line.name}</p>
          <p className="text-[11px] tabular-nums text-text-4">
            {fmtMoney(line.unitPrice)} · {line.sku}
          </p>
        </div>
        <p className="shrink-0 text-[13.5px] font-extrabold tabular-nums text-text">{fmtMoney(priced.total)}</p>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center rounded-lg border border-border bg-surface-subtle">
          <button
            type="button"
            disabled={disabled || line.quantity <= 1}
            className="flex size-8 items-center justify-center text-text-2 disabled:opacity-30"
            onClick={() => onQty(line.quantity - 1)}
            aria-label="Decrease quantity"
          >
            <Minus className="size-3.5" />
          </button>
          <span className="min-w-7 text-center text-[13px] font-bold tabular-nums">{line.quantity}</span>
          <button
            type="button"
            disabled={disabled || line.quantity >= line.stock}
            className="flex size-8 items-center justify-center text-text-2 disabled:opacity-30"
            onClick={() => onQty(line.quantity + 1)}
            aria-label="Increase quantity"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="xs" disabled={disabled} onClick={onPickRule}>
            <Tag className="size-3.5" />
            {priced.discount > 0 ? `−${fmtMoney(priced.discount)}` : "Discount"}
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" disabled={disabled} onClick={onRemove} aria-label="Remove">
            <Trash2 className="size-3.5 text-red" />
          </Button>
        </div>
      </div>
    </div>
  );
}
