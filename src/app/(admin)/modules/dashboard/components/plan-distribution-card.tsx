import { Card } from "@/components/ui/card";

export function PlanDistributionCard({
  distribution,
  totalTenants,
}: {
  distribution: { planId: string; name: string; tenants: number }[];
  totalTenants: number;
}) {
  const total = totalTenants || 1;

  return (
    <Card className="flex flex-col gap-3 p-5">
      <h3 className="text-[13px] font-bold text-text min-[1440px]:text-[14px]">Plan distribution</h3>
      <div className="flex flex-col gap-3">
        {distribution.map((row) => (
          <div key={row.planId} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[12px] min-[1440px]:text-[13px]">
              <span className="font-semibold text-text-2">{row.name}</span>
              <span className="text-text-4">{row.tenants} tenants</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-subtle">
              <div
                className="h-full rounded-full bg-blue transition-all"
                style={{ width: `${Math.round((row.tenants / total) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
