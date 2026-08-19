"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types/plan";

type PlanSelectCardProps = {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
};

/** Compact selectable row for /signup's plan step — no feature checklist,
 * just the essentials needed to pick a plan quickly. Distinct from
 * plan-card.tsx, which is built for the wide /pricing grid. */
export function PlanSelectCard({ plan, selected, onSelect }: PlanSelectCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-xl border-2 p-4 text-left transition-all duration-150",
        selected
          ? "border-blue bg-blue-l shadow-sm shadow-blue/10"
          : "border-border bg-surface hover:border-text-4"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            selected ? "border-blue bg-blue" : "border-border"
          )}
        >
          {selected && <Check className="size-3 text-white" />}
        </span>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-bold text-text">{plan.name}</span>
            {plan.popular && (
              <span className="rounded-full bg-blue px-2 py-0.5 text-[9px] font-bold text-white">Popular</span>
            )}
          </div>
          <div className="text-[11.5px] text-text-4">
            {plan.baseSeats > 0 ? `${plan.baseSeats} seats included` : "Custom seats"}
          </div>
        </div>
      </div>

      <div className="shrink-0 text-right">
        {plan.priceMonthly > 0 ? (
          <>
            <div className="text-[14px] font-extrabold text-text">AED {plan.priceMonthly.toLocaleString()}</div>
            <div className="text-[10px] text-text-4">/month</div>
          </>
        ) : (
          <div className="text-[13px] font-bold text-text">Custom</div>
        )}
      </div>
    </button>
  );
}
