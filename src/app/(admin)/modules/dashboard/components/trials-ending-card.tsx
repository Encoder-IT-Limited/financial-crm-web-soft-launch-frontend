import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Plan } from "@/types/plan";
import type { Tenant } from "../../tenants/types";
import { isTrialEndingSoon, trialDaysLeft } from "../lib/metrics";

export function TrialsEndingCard({ tenants, plans }: { tenants: Tenant[]; plans: Plan[] }) {
  const planName = (planId: string) => plans.find((p) => p.id === planId)?.name ?? "—";

  const ending = tenants
    .map((tenant) => ({ tenant, daysLeft: trialDaysLeft(tenant, plans.find((p) => p.id === tenant.planId)) }))
    .filter(({ tenant, daysLeft }) => daysLeft !== null && isTrialEndingSoon(tenant, plans.find((p) => p.id === tenant.planId)))
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));

  return (
    <Card className="flex flex-col gap-3 p-5">
      <h3 className="text-[13px] font-bold text-text min-[1440px]:text-[14px]">Trials ending soon</h3>
      {ending.length === 0 ? (
        <p className="py-6 text-center text-[12.5px] text-text-4 min-[1440px]:text-[13.5px]">
          No trials ending in the next 7 days.
        </p>
      ) : (
        <div className="flex flex-col">
          {ending.map(({ tenant, daysLeft }) => (
            <Link
              key={tenant.id}
              href={`/admin/tenants?tenant=${tenant.id}`}
              className="flex items-center gap-3 border-b border-border py-3 last:border-b-0 hover:bg-surface-subtle"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-text min-[1440px]:text-[13.5px]">
                  {tenant.name}
                </p>
                <p className="text-[11px] text-text-4 min-[1440px]:text-[12px]">{planName(tenant.planId)}</p>
              </div>
              <Badge tone={daysLeft !== null && daysLeft <= 2 ? "red" : "amber"}>
                {daysLeft === 0 ? "Ends today" : `${daysLeft}d left`}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
