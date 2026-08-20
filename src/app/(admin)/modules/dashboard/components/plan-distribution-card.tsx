import { Card } from "@/components/ui/card";
import type { Plan } from "@/types/plan";
import type { Tenant } from "../../tenants/types";

export function PlanDistributionCard({ tenants, plans }: { tenants: Tenant[]; plans: Plan[] }) {
  const counts = plans.map((plan) => ({
    plan,
    count: tenants.filter((t) => t.planId === plan.id).length,
  }));
  const total = tenants.length || 1;

  return (
    <Card className="flex flex-col gap-3 p-5">
      <h3 className="text-[13px] font-bold text-text min-[1440px]:text-[14px]">Plan distribution</h3>
      <div className="flex flex-col gap-3">
        {counts.map(({ plan, count }) => (
          <div key={plan.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[12px] min-[1440px]:text-[13px]">
              <span className="font-semibold text-text-2">{plan.name}</span>
              <span className="text-text-4">{count} tenants</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-subtle">
              <div
                className="h-full rounded-full bg-blue transition-all"
                style={{ width: `${Math.round((count / total) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
