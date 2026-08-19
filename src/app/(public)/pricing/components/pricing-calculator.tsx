"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLANS } from "../../components/plans-data";
import { TierCard } from "./tier-card";
import { incrementalModules, type BillingPeriod } from "./pricing-utils";

const BILLING_OPTIONS: { key: BillingPeriod; label: string }[] = [
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

const MIN_SEATS = 1;

export function PricingCalculator() {
  const [seats, setSeats] = useState(10);
  const [billing, setBilling] = useState<BillingPeriod>("monthly");

  function setClampedSeats(next: number) {
    setSeats(Number.isFinite(next) ? Math.max(MIN_SEATS, Math.round(next)) : MIN_SEATS);
  }

  return (
    <div>
      <div className="flex flex-col items-center gap-7">
        {/* Billing tabs */}
        <div className="flex items-center gap-0.5 rounded-lg bg-surface-subtle p-1 xl:p-1.5">
          {BILLING_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setBilling(option.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-5 py-2 text-[13px] font-medium transition-colors xl:px-6 xl:py-2.5 xl:text-[15px] 3xl:px-7 3xl:text-lg",
                billing === option.key ? "bg-surface font-semibold text-text shadow-sm" : "text-text-3"
              )}
            >
              {option.label}
              {option.key === "yearly" && (
                <span className="rounded-full bg-green-l px-1.5 py-0.5 text-[9.5px] font-bold text-green xl:text-[11px] 3xl:text-xs">
                  Save 20%
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Seats stepper */}
        <div className="flex items-center gap-3 text-[13.5px] text-text-3 xl:text-[15px] 3xl:text-lg">
          <span>Estimate for</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setClampedSeats(seats - 1)}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-3 transition-colors hover:border-text-4 hover:text-text xl:size-10 3xl:size-11"
              aria-label="Decrease seats"
            >
              <Minus className="size-3.5 xl:size-4" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={MIN_SEATS}
              value={seats}
              onChange={(e) => setClampedSeats(Number(e.target.value))}
              className="h-9 w-20 rounded-lg border border-border bg-surface text-center text-[15px] font-bold text-text outline-none focus:border-blue xl:h-10 xl:w-24 xl:text-base 3xl:h-11 3xl:w-28 3xl:text-lg [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Number of seats"
            />
            <button
              type="button"
              onClick={() => setClampedSeats(seats + 1)}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-3 transition-colors hover:border-text-4 hover:text-text xl:size-10 3xl:size-11"
              aria-label="Increase seats"
            >
              <Plus className="size-3.5 xl:size-4" />
            </button>
          </div>
          <span>seats</span>
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3">
        {PLANS.map((plan, index) => (
          <TierCard
            key={plan.id}
            plan={plan}
            seats={seats}
            billing={billing}
            incrementalModuleKeys={incrementalModules(PLANS, index)}
            previousPlanName={index > 0 ? PLANS[index - 1].name : undefined}
          />
        ))}
      </div>
    </div>
  );
}
