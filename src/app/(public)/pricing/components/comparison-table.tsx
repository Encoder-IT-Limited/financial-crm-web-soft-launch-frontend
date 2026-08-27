"use client";

import { Fragment } from "react";
import { CheckCircle2, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODULE_LABELS, type ModuleKey } from "@/lib/permissions";
import { PLANS } from "../../components/plans-data";
import { usePublicPlans } from "../../modules/plans/hooks/use-public-plans";
import { usePlatformCurrency } from "../../modules/settings/hooks/use-public-settings";
import type { Plan } from "@/types/plan";

const CATEGORIES: { title: string; modules: ModuleKey[] }[] = [
  { title: "Accounting & Finance", modules: ["accounting", "banking"] },
  { title: "Sales & Purchasing", modules: ["sales", "purchasing"] },
  { title: "Inventory & CRM", modules: ["inventory", "crm"] },
  { title: "Reports & AI", modules: ["reports", "ai-assistant"] },
];

function billingRows(currency: string): { label: string; render: (plan: Plan) => string }[] {
  return [
    {
      label: "Base seats included",
      render: (plan) => (plan.baseSeats > 0 ? String(plan.baseSeats) : "Custom"),
    },
    {
      label: "Additional seat price",
      render: (plan) => (plan.additionalSeatPrice > 0 ? `${currency} ${plan.additionalSeatPrice}` : "Custom"),
    },
    {
      label: "Free trial",
      render: (plan) => (plan.trialDays > 0 ? `${plan.trialDays} days` : "—"),
    },
  ];
}

export function ComparisonTable() {
  const { data: livePlans } = usePublicPlans();
  const currency = usePlatformCurrency();
  const plans = livePlans?.length ? livePlans : PLANS;
  const rows = billingRows(currency);

  function planColClass(index: number) {
    return plans[index]?.popular ? "bg-blue-l/50" : undefined;
  }

  return (
    <div className="mx-auto max-w-4xl overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
      <table className="w-full min-w-[600px] border-collapse text-[12.5px] xl:text-sm 3xl:text-base">
        <thead>
          <tr>
            <th className="w-2/5 border-b border-border bg-surface-subtle px-5 py-4 text-left align-bottom text-[11px] font-bold tracking-wide text-text-4 uppercase xl:text-xs 3xl:text-sm">
              Features
            </th>
            {plans.map((plan, i) => (
              <th
                key={plan.id}
                className={cn(
                  "border-b border-border bg-surface-subtle px-4 py-4 text-center align-bottom",
                  planColClass(i),
                )}
              >
                <div className="text-[13.5px] font-extrabold text-text xl:text-base 3xl:text-lg">{plan.name}</div>
                {plan.popular && (
                  <div className="mt-1 text-[9.5px] font-bold tracking-wide text-blue uppercase xl:text-[10.5px] 3xl:text-xs">
                    Most popular
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.map((category) => (
            <Fragment key={category.title}>
              <tr>
                <td
                  colSpan={plans.length + 1}
                  className="border-b border-border bg-surface-subtle/60 px-5 py-2 text-[10.5px] font-bold tracking-wide text-text-3 uppercase xl:text-xs 3xl:text-sm"
                >
                  {category.title}
                </td>
              </tr>
              {category.modules.map((moduleKey) => (
                <tr key={moduleKey} className="group">
                  <td className="border-b border-border px-5 py-3 text-text-2 group-hover:bg-surface-subtle/40">
                    {MODULE_LABELS[moduleKey]}
                  </td>
                  {plans.map((plan, i) => (
                    <td
                      key={plan.id}
                      className={cn(
                        "border-b border-border px-4 py-3 text-center group-hover:bg-surface-subtle/40",
                        planColClass(i),
                      )}
                    >
                      {plan.modules.includes(moduleKey) ? (
                        <CheckCircle2 className="mx-auto size-[18px] text-green xl:size-5" />
                      ) : (
                        <Minus className="mx-auto size-3.5 text-text-4 xl:size-4" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}

          <tr>
            <td
              colSpan={plans.length + 1}
              className="border-b border-border bg-surface-subtle/60 px-5 py-2 text-[10.5px] font-bold tracking-wide text-text-3 uppercase xl:text-xs 3xl:text-sm"
            >
              Seats & billing
            </td>
          </tr>
          {rows.map((row, rowIndex) => (
            <tr key={row.label} className="group">
              <td
                className={cn(
                  "px-5 py-3 text-text-2",
                  rowIndex === rows.length - 1 ? "" : "border-b border-border",
                  "group-hover:bg-surface-subtle/40",
                )}
              >
                {row.label}
              </td>
              {plans.map((plan, i) => (
                <td
                  key={plan.id}
                  className={cn(
                    "px-4 py-3 text-center font-semibold text-text",
                    rowIndex === rows.length - 1 ? "" : "border-b border-border",
                    "group-hover:bg-surface-subtle/40",
                    planColClass(i),
                  )}
                >
                  {row.render(plan)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
