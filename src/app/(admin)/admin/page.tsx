"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeading } from "@/components/shared/page-heading";
import { dashboardApi } from "../modules/dashboard/api/dashboard.service";
import { KpiRow } from "../modules/dashboard/components/kpi-row";
import { PlanDistributionCard } from "../modules/dashboard/components/plan-distribution-card";
import { TrialsEndingCard } from "../modules/dashboard/components/trials-ending-card";
import { RecentActivityCard } from "../modules/dashboard/components/recent-activity-card";
import { RecentPaymentsCard } from "../modules/dashboard/components/recent-payments-card";

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-dashboard"], queryFn: dashboardApi.get });

  if (isLoading || !data) {
    return (
      <div>
        <PageHeading title="Platform overview" subtitle="MRM Super Admin · all tenant accounts" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-xl border border-border bg-surface-subtle" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading title="Platform overview" subtitle="MRM Super Admin · all tenant accounts" />

      <KpiRow kpis={data.kpis} />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <PlanDistributionCard distribution={data.planDistribution} totalTenants={data.kpis.totalTenants} />
        <TrialsEndingCard items={data.trialsEndingSoon} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentActivityCard entries={data.recentActivity} />
        <RecentPaymentsCard payments={data.recentPayments} />
      </div>
    </div>
  );
}
