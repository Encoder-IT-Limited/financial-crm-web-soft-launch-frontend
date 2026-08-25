"use client";

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtMoney } from "@/lib/format";
import type { CartLine } from "../lib/pos-pricing";
import { cartTotals, priceLine } from "../lib/pos-pricing";
import type { PosDiscountRule } from "../api/pos.service";
import { PosCartLineRow } from "./pos-cart-line";

export function PosCart({
  lines,
  rules,
  onQty,
  onRemove,
  onPickRule,
  onClear,
  onCharge,
  charging,
  disabled,
}: {
  lines: CartLine[];
  rules: PosDiscountRule[];
  onQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onPickRule: (productId: string) => void;
  onClear: () => void;
  onCharge: () => void;
  charging?: boolean;
  disabled?: boolean;
}) {
  const priced = lines.map((line) => {
    const rule = rules.find((r) => r.id === line.discountRuleId && r.active);
    return { line, ...priceLine(line, rule ? { type: rule.type, value: Number(rule.value) } : null) };
  });
  const totals = cartTotals(priced);
  const items = lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-l border-border bg-surface lg:w-[380px] xl:w-[420px]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-[13px] font-extrabold text-text">Ticket</p>
          <p className="text-[11.5px] text-text-3">
            {items} item{items === 1 ? "" : "s"}
          </p>
        </div>
        {lines.length > 0 && (
          <Button variant="ghost" size="sm" disabled={disabled} onClick={onClear}>
            Clear
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {lines.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <ShoppingBag className="mb-2 size-8 text-text-4" />
            <p className="text-[13.5px] font-bold text-text">Empty ticket</p>
            <p className="mt-1 max-w-[220px] text-[12px] text-text-3">
              Scan a barcode or tap a product to start the sale.
            </p>
          </div>
        ) : (
          priced.map(({ line }) => (
            <PosCartLineRow
              key={line.productId}
              line={line}
              rule={rules.find((r) => r.id === line.discountRuleId) ?? null}
              onQty={(qty) => onQty(line.productId, qty)}
              onRemove={() => onRemove(line.productId)}
              onPickRule={() => onPickRule(line.productId)}
              disabled={disabled}
            />
          ))
        )}
      </div>

      <div className="border-t border-border bg-surface-subtle p-4">
        <dl className="space-y-1.5 text-[12.5px]">
          <div className="flex justify-between text-text-3">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{fmtMoney(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between text-text-3">
            <dt>Discount</dt>
            <dd className="tabular-nums text-green">{totals.discount ? `−${fmtMoney(totals.discount)}` : "—"}</dd>
          </div>
          <div className="flex justify-between text-text-3">
            <dt>Tax</dt>
            <dd className="tabular-nums">{fmtMoney(totals.tax)}</dd>
          </div>
          <div className="flex justify-between pt-1 text-[18px] font-extrabold text-text">
            <dt>Due</dt>
            <dd className="tabular-nums">{fmtMoney(totals.total)}</dd>
          </div>
        </dl>
        <Button
          size="lg"
          className="mt-3 h-12 w-full rounded-xl text-[15px] font-bold"
          disabled={disabled || charging || lines.length === 0}
          onClick={onCharge}
        >
          {charging ? "Posting…" : `Charge ${fmtMoney(totals.total)}`}
        </Button>
      </div>
    </aside>
  );
}
