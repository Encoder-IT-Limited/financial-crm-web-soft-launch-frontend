import Link from "next/link";
import { Building2, DollarSign, Clock, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { fmtMoney } from "@/lib/format";
import type { AdminDashboardKpis } from "../api/dashboard.service";

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

export function KpiRow({ kpis }: { kpis: AdminDashboardKpis }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Active tenants"
        value={`${kpis.activeTenants} / ${kpis.totalTenants}`}
        icon={Building2}
        href="/admin/tenants"
      />
      <StatCard label="MRR" value={fmtMoney(kpis.mrr)} icon={DollarSign} />
      <StatCard label="Trials ending in 7d" value={String(kpis.trialsEndingIn7Days)} icon={Clock} />
      <StatCard
        label="New tenants (30d)"
        value={String(kpis.newTenantsLast30Days)}
        icon={UserPlus}
        href="/admin/tenants"
      />
    </div>
  );
}
