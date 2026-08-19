import { Fragment } from "react";
import { CheckCircle2, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODULE_LABELS, type ModuleKey } from "@/lib/permissions";
import { PLANS } from "../../components/plans-data";

const CATEGORIES: { title: string; modules: ModuleKey[] }[] = [
  { title: "Accounting & Finance", modules: ["accounting", "banking"] },
  { title: "Sales & Purchasing", modules: ["sales", "purchasing"] },
  { title: "Inventory & CRM", modules: ["inventory", "crm"] },
  { title: "Reports & AI", modules: ["reports", "ai-assistant"] },
];

const BILLING_ROWS: { label: string; render: (planIndex: number) => string }[] = [
  {
    label: "Base seats included",
    render: (i) => (PLANS[i].baseSeats > 0 ? String(PLANS[i].baseSeats) : "Custom"),
  },
  {
    label: "Additional seat price",
    render: (i) => (PLANS[i].additionalSeatPrice > 0 ? `AED ${PLANS[i].additionalSeatPrice}` : "Custom"),
  },
  {
    label: "Free trial",
    render: (i) => (PLANS[i].trialDays > 0 ? `${PLANS[i].trialDays} days` : "—"),
  },
];

function planColClass(index: number) {
  return PLANS[index].popular ? "bg-blue-l/50" : undefined;
}

export function ComparisonTable() {
  return (
    <div className="mx-auto max-w-4xl overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
      <table className="w-full min-w-[600px] border-collapse text-[12.5px] xl:text-sm 3xl:text-base">
        <thead>
          <tr>
            <th className="w-2/5 border-b border-border bg-surface-subtle px-5 py-4 text-left align-bottom text-[11px] font-bold tracking-wide text-text-4 uppercase xl:text-xs 3xl:text-sm">
              Features
            </th>
            {PLANS.map((plan, i) => (
              <th
                key={plan.id}
                className={cn(
                  "border-b border-border bg-surface-subtle px-4 py-4 text-center align-bottom",
                  planColClass(i)
                )}
              >
                <div className="text-[13.5px] font-extrabold text-text xl:text-base 3xl:text-lg">
                  {plan.name}
                </div>
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
                  colSpan={PLANS.length + 1}
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
                  {PLANS.map((plan, i) => (
                    <td
                      key={plan.id}
                      className={cn(
                        "border-b border-border px-4 py-3 text-center group-hover:bg-surface-subtle/40",
                        planColClass(i)
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
              colSpan={PLANS.length + 1}
              className="border-b border-border bg-surface-subtle/60 px-5 py-2 text-[10.5px] font-bold tracking-wide text-text-3 uppercase xl:text-xs 3xl:text-sm"
            >
              Seats & billing
            </td>
          </tr>
          {BILLING_ROWS.map((row, rowIndex) => (
            <tr key={row.label} className="group">
              <td
                className={cn(
                  "px-5 py-3 text-text-2",
                  rowIndex === BILLING_ROWS.length - 1 ? "" : "border-b border-border",
                  "group-hover:bg-surface-subtle/40"
                )}
              >
                {row.label}
              </td>
              {PLANS.map((plan, i) => (
                <td
                  key={plan.id}
                  className={cn(
                    "px-4 py-3 text-center font-semibold text-text",
                    rowIndex === BILLING_ROWS.length - 1 ? "" : "border-b border-border",
                    "group-hover:bg-surface-subtle/40",
                    planColClass(i)
                  )}
                >
                  {row.render(i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
