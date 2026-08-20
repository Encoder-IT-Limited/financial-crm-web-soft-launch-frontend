import Link from "next/link";
import { Building2, DollarSign, Clock, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { fmtMoney } from "@/lib/format";
import type { Plan } from "@/types/plan";
import type { Tenant } from "../../tenants/types";
import { isTrialEndingSoon, newTenantsCount, platformMrr } from "../lib/metrics";

function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}) {
  const content = (
    <Card className="flex items-center gap-3 p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-l text-blue">
        <Icon className="size-4.5" />
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase text-text-4 min-[1440px]:text-[12px]">{label}</div>
        <div className="text-xl font-extrabold text-text min-[1440px]:text-[22px]">{value}</div>
      </div>
    </Card>
  );
  return href ? (
    <Link href={href} className="transition-transform hover:-translate-y-0.5">
      {content}
    </Link>
  ) : (
    content
  );
}

export function KpiRow({ tenants, plans }: { tenants: Tenant[]; plans: Plan[] }) {
  const activeCount = tenants.filter((t) => t.status === "active").length;
  const mrr = platformMrr(tenants, plans);
  const trialsEndingCount = tenants.filter((t) => isTrialEndingSoon(t, plans.find((p) => p.id === t.planId))).length;
  const newTenants30d = newTenantsCount(tenants, 30);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Active tenants" value={`${activeCount} / ${tenants.length}`} icon={Building2} href="/admin/tenants" />
      <StatCard label="MRR" value={fmtMoney(mrr)} icon={DollarSign} />
      <StatCard label="Trials ending in 7d" value={String(trialsEndingCount)} icon={Clock} />
      <StatCard label="New tenants (30d)" value={String(newTenants30d)} icon={UserPlus} href="/admin/tenants" />
    </div>
  );
}
