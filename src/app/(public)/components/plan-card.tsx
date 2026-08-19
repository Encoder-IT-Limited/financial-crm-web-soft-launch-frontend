"use client";

import { Check } from "lucide-react";
import { MODULE_LABELS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types/plan";

type PlanCardProps = {
  plan: Plan;
  selected?: boolean;
  onSelect?: () => void;
  cta?: React.ReactNode;
  className?: string;
};

/** Reused on /pricing (browse-only) and /signup (selectable, via onSelect). */
export function PlanCard({ plan, selected, onSelect, cta, className }: PlanCardProps) {
  const interactive = Boolean(onSelect);

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (interactive && (e.key === "Enter" || e.key === " ")) onSelect?.();
      }}
      className={cn(
        "relative flex flex-col rounded-2xl border-2 border-border bg-surface p-6 text-center transition-colors",
        interactive && "cursor-pointer hover:border-blue",
        selected && "border-blue",
        className
      )}
    >
      {plan.popular && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-blue px-3 py-0.5 text-[10px] font-bold text-white">
          Most popular
        </span>
      )}

      <div className="text-sm font-bold text-text">{plan.name}</div>
      {plan.priceMonthly > 0 ? (
        <>
          <div className="mt-2 text-2xl font-extrabold text-text">
            AED {plan.priceMonthly.toLocaleString()}
            <span className="text-xs font-medium text-text-4">/mo</span>
          </div>
          <div className="mt-1 text-[11px] text-text-4">
            {plan.baseSeats} seats included · AED {plan.additionalSeatPrice}/extra seat
          </div>
          {plan.trialDays > 0 && (
            <div className="mt-1 text-[11px] text-blue">{plan.trialDays}-day free trial</div>
          )}
        </>
      ) : (
        <>
          <div className="mt-2 text-2xl font-extrabold text-text">Custom</div>
          <div className="mt-1 text-[11px] text-text-4">Seats and pricing tailored to your team</div>
        </>
      )}

      <ul className="mt-5 flex flex-col gap-2 text-left text-[12px] text-text-2">
        {plan.modules.map((moduleKey) => (
          <li key={moduleKey} className="flex items-center gap-2">
            <Check className="size-3.5 shrink-0 text-green" />
            {MODULE_LABELS[moduleKey]}
          </li>
        ))}
      </ul>

      {cta && <div className="mt-5">{cta}</div>}
    </div>
  );
}
