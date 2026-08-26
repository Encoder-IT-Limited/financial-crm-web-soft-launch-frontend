"use client";

import { Card } from "@/components/ui/card";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Adjustment, Currency } from "../types";
import { AdjustmentStatusBadge } from "./adjustment-status-badge";

export function InvoiceAdjustmentsCard({
  adjustments,
  currency,
}: {
  adjustments: Adjustment[];
  currency: Currency;
}) {
  if (adjustments.length === 0) return null;
  return (
    <Card className="gap-0 p-0">
      <div className="border-b border-border px-5 py-3 text-sm font-bold text-text">Adjustments</div>
      <div className="flex flex-col divide-y divide-border">
        {adjustments.map((adj) => (
          <div key={adj.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
            <div>
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-text">
                {adj.number}
                <AdjustmentStatusBadge status={adj.status} />
              </div>
              <div className="mt-0.5 text-[11px] text-text-3">{adj.reason}</div>
            </div>
            <span className={cn("shrink-0 text-[13px] font-semibold", adj.kind === "credit" ? "text-green" : "text-amber")}>
              {adj.kind === "credit" ? "−" : "+"}
              {fmtMoney(adj.amount, currency)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
