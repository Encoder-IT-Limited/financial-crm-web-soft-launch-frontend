import { apiGet } from "@/lib/api/envelope";
import type { Plan } from "@/types/plan";
import type { AuditLogEntry } from "../../audit/types";
import type { PaymentTransaction } from "../../payments/types";

export type AdminDashboardKpis = {
  activeTenants: number;
  totalTenants: number;
  mrr: number;
  trialsEndingIn7Days: number;
  atRiskTenants: number;
  newTenantsLast30Days: number;
};

export type AdminDashboard = {
  kpis: AdminDashboardKpis;
  planDistribution: { planId: string; name: string; tenants: number }[];
  trialsEndingSoon: { id: string; name: string; planName: string; daysLeft: number }[];
  recentActivity: AuditLogEntry[];
  recentPayments: PaymentTransaction[];
  plans: Plan[];
};

export const dashboardApi = {
  get: () => apiGet<AdminDashboard>("/admin/dashboard"),
};
