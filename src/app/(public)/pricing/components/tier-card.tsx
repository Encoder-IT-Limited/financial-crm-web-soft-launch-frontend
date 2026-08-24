import Link from "next/link";
import { Check } from "lucide-react";
import { MODULE_LABELS, type ModuleKey } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types/plan";
import { clampSeatsForPlan, computePlanTotal, type BillingPeriod } from "./pricing-utils";

type TierCardProps = {
  plan: Plan;
  seats: number;
  billing: BillingPeriod;
  incrementalModuleKeys: ModuleKey[];
  previousPlanName?: string;
};

export function TierCard({ plan, seats, billing, incrementalModuleKeys, previousPlanName }: TierCardProps) {
  // Enterprise stays sales-assisted even though it now shows an indicative
  // price — decoupled from priceMonthly so a future zero-priced plan
  // wouldn't accidentally get routed to self-serve signup.
  const isSalesAssisted = plan.id === "enterprise";
  const isCustom = plan.priceMonthly === 0;
  const isPopular = Boolean(plan.popular);
  const effectiveSeats = clampSeatsForPlan(plan, seats);
  const seatsClamped = effectiveSeats !== seats;
  const total = computePlanTotal(plan, effectiveSeats, billing);
  const seatRangeLabel = plan.maxSeats ? `${plan.minSeats}–${plan.maxSeats}` : `${plan.minSeats}+`;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl p-6 transition-all xl:p-7 3xl:p-8",
        isPopular
          ? "bg-linear-to-br from-navy to-blue text-white shadow-xl shadow-blue/20"
          : "border-2 border-border bg-surface"
      )}
    >
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[10px] font-bold text-blue xl:text-[11px]">
          Most popular
        </span>
      )}

      <div className={cn("text-sm font-bold xl:text-base 3xl:text-lg", isPopular ? "text-white" : "text-text")}>
        {plan.name}
      </div>

      {isCustom ? (
        <div className="mt-3 text-3xl font-extrabold text-text xl:text-4xl 3xl:text-5xl">Custom</div>
      ) : (
        <div className="mt-3 flex items-baseline gap-1">
          <span
            className={cn(
              "text-3xl font-extrabold xl:text-4xl 3xl:text-5xl",
              isPopular ? "text-white" : "text-text"
            )}
          >
            AED {total.toLocaleString()}
          </span>
          <span className={cn("text-[12px] xl:text-sm 3xl:text-base", isPopular ? "text-white/70" : "text-text-4")}>
            /{billing === "monthly" ? "mo" : "yr"}
          </span>
        </div>
      )}
      <div className={cn("mt-1 text-[11.5px] xl:text-[13px] 3xl:text-sm", isPopular ? "text-white/60" : "text-text-4")}>
        {isCustom
          ? "Seats tailored to your team"
          : `For teams of ${seatRangeLabel} seats · AED ${plan.additionalSeatPrice}/extra seat`}
      </div>
      {!isCustom && seatsClamped && (
        <div className={cn("mt-0.5 text-[10.5px] xl:text-[12px]", isPopular ? "text-white/50" : "text-text-4")}>
          Priced for {effectiveSeats} seats (this plan&apos;s {effectiveSeats === plan.minSeats ? "minimum" : "maximum"})
        </div>
      )}

      <Link
        href={isSalesAssisted ? "/contact" : `/signup?plan=${plan.id}`}
        className={cn(
          "mt-6 block rounded-lg py-2.5 text-center text-[12.5px] font-semibold transition-all xl:py-3 xl:text-[13.5px] 3xl:py-3.5 3xl:text-base",
          isPopular
            ? "bg-white text-blue hover:brightness-95"
            : "border border-border text-text-2 hover:border-text-4"
        )}
      >
        {isSalesAssisted ? "Contact sales" : `Choose ${plan.name}`}
      </Link>

      <ul
        className={cn(
          "mt-6 flex flex-1 flex-col gap-2.5 border-t pt-6 text-[12.5px] xl:text-[13.5px] 3xl:text-base",
          isPopular ? "border-white/15 text-white/90" : "border-border text-text-2"
        )}
      >
        {previousPlanName && (
          <li
            className={cn(
              "text-[11.5px] font-semibold uppercase xl:text-[12.5px] 3xl:text-sm",
              isPopular ? "text-white/50" : "text-text-4"
            )}
          >
            Everything in {previousPlanName}, plus:
          </li>
        )}
        {incrementalModuleKeys.map((key) => (
          <li key={key} className="flex items-center gap-2">
            <Check
              className={cn("size-3.5 shrink-0 xl:size-4", isPopular ? "text-white" : "text-green")}
            />
            {MODULE_LABELS[key]}
          </li>
        ))}
      </ul>
    </div>
  );
}
