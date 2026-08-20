"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeading } from "@/components/shared/page-heading";
import { tenantsApi } from "../modules/tenants/api/tenants.service";
import { planApi } from "../modules/plans/api/plans.service";
import { auditApi } from "../modules/audit/api/audit.service";
import { paymentsApi } from "../modules/payments/api/payments.service";
import { KpiRow } from "../modules/dashboard/components/kpi-row";
import { PlanDistributionCard } from "../modules/dashboard/components/plan-distribution-card";
import { TrialsEndingCard } from "../modules/dashboard/components/trials-ending-card";
import { RecentActivityCard } from "../modules/dashboard/components/recent-activity-card";
import { RecentPaymentsCard } from "../modules/dashboard/components/recent-payments-card";

export default function AdminDashboardPage() {
  const { data: tenants = [], isLoading: tenantsLoading } = useQuery({ queryKey: ["tenants"], queryFn: tenantsApi.list });
  const { data: plans = [], isLoading: plansLoading } = useQuery({ queryKey: ["plans"], queryFn: planApi.list });
  const { data: auditEntries = [], isLoading: auditLoading } = useQuery({ queryKey: ["audit"], queryFn: auditApi.list });
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({ queryKey: ["payments"], queryFn: paymentsApi.list });

  const loading = tenantsLoading || plansLoading || auditLoading || paymentsLoading;

  if (loading) {
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

      <KpiRow tenants={tenants} plans={plans} />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <PlanDistributionCard tenants={tenants} plans={plans} />
        <TrialsEndingCard tenants={tenants} plans={plans} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentActivityCard entries={auditEntries} />
        <RecentPaymentsCard payments={payments} />
      </div>
    </div>
  );
}
