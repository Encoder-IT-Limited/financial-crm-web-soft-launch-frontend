"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeading } from "@/components/shared/page-heading";
import { SeatMeter } from "@/components/shared/seat-meter";
import { StatusBadge } from "@/components/shared/status-badge";
import { MODULE_LABELS, type ModuleKey } from "@/lib/permissions";
import { daysFromNow, fmtDate, fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuditStore } from "../../audit/store/audit-store";
import { AuditLogRow } from "../../audit/components/audit-log-row";
import { usePlansStore } from "../../plans/store/plans-store";
import { tenantsApi } from "../api/tenants.service";
import { useTenantsStore } from "../store/tenants-store";
import { seatUsage, tenantMrr, TENANT_ROLE_LABELS } from "../types";
import { AddSeatsDialog } from "./add-seats-dialog";

export function TenantDetail({ tenantId }: { tenantId: string }) {
  const tenant = useTenantsStore((state) => state.tenants.find((t) => t.id === tenantId));
  const plans = usePlansStore((state) => state.plans);
  const activity = useAuditStore((state) => state.entries.filter((entry) => entry.tenantId === tenantId));
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [addSeatsOpen, setAddSeatsOpen] = useState(false);

  if (!tenant) {
    return (
      <Card className="p-6 text-[13px] text-text-4">
        Tenant not found. <Link href="/admin/tenants" className="text-blue hover:underline">Back to All Clients</Link>
      </Card>
    );
  }

  const plan = plans.find((p) => p.id === tenant.planId);
  const { used, total } = seatUsage(tenant, plan);
  const mrr = tenantMrr(tenant, plan);
  const retentionDaysLeft = tenant.pendingDeletionAt ? daysFromNow(tenant.pendingDeletionAt) : null;

  return (
    <div>
      <Link href="/admin/tenants" className="mb-3 flex items-center gap-1.5 text-[12.5px] font-semibold text-text-3 hover:text-text">
        <ArrowLeft className="size-3.5" /> Back to All Clients
      </Link>

      <PageHeading
        title={tenant.name}
        subtitle={`${plan?.name ?? "Unknown plan"} · ${tenant.billingCycle === "monthly" ? "Monthly" : "Yearly"} billing`}
        actions={
          <>
            <StatusBadge status={tenant.status} />
            {tenant.status === "active" ? (
              <Button variant="outline" size="sm" onClick={() => setSuspendOpen(true)}>
                Suspend
              </Button>
            ) : (
              tenant.status !== "cancelled" && (
                <Button variant="outline" size="sm" onClick={() => setReactivateOpen(true)}>
                  Reactivate
                </Button>
              )
            )}
          </>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList variant="line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="seats">Seats</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="p-4">
              <div className="mb-1.5 text-[11px] font-semibold uppercase text-text-4">Plan</div>
              <div className="text-lg font-extrabold text-text">{plan?.name ?? "—"}</div>
            </Card>
            <Card className="p-4">
              <div className="mb-1.5 text-[11px] font-semibold uppercase text-text-4">MRR</div>
              <div className="text-lg font-extrabold text-text">{fmtMoney(mrr)}</div>
            </Card>
            <Card className="p-4">
              <div className="mb-1.5 text-[11px] font-semibold uppercase text-text-4">Seats</div>
              <SeatMeter used={used} total={total} />
            </Card>
            <Card className="p-4">
              <div className="mb-1.5 text-[11px] font-semibold uppercase text-text-4">Customer since</div>
              <div className="text-lg font-extrabold text-text">{fmtDate(tenant.createdAt)}</div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seats" className="mt-4">
          <Card className="gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SeatMeter used={used} total={total} className="min-w-[160px]" />
              <Button size="sm" onClick={() => setAddSeatsOpen(true)}>
                <Plus /> Add seats
              </Button>
            </div>
            <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
              {tenant.users.map((user) => {
                const counts = ["owner", "admin", "staff", "pos-cashier"].includes(user.role);
                return (
                  <div key={user.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                    <div className="min-w-[160px]">
                      <div className="text-[12.5px] font-semibold text-text">{user.name}</div>
                      <div className="text-[11px] text-text-4">{user.email}</div>
                    </div>
                    <Badge tone="neutral">{TENANT_ROLE_LABELS[user.role]}</Badge>
                    <span className={cn("ml-auto text-[11px] font-semibold", counts ? "text-blue" : "text-text-4")}>
                      {counts ? "Counts toward seat" : "Doesn't count"}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="mt-4">
          <Card className="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase text-text-4">Plan</div>
              <div className="text-[13px] font-semibold text-text">{plan?.name ?? "—"}</div>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase text-text-4">Billing cycle</div>
              <div className="text-[13px] font-semibold text-text">{tenant.billingCycle === "monthly" ? "Monthly" : "Yearly"}</div>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase text-text-4">Renewal date</div>
              <div className="text-[13px] font-semibold text-text">{fmtDate(tenant.renewalDate)}</div>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase text-text-4">Status</div>
              <StatusBadge status={tenant.status} />
            </div>
            {tenant.status === "pending-deletion" && (
              <div className="sm:col-span-2 rounded-lg bg-red-l p-3 text-[12.5px] text-red">
                {retentionDaysLeft !== null && retentionDaysLeft >= 0
                  ? `Permanently deleted in ${retentionDaysLeft} day${retentionDaysLeft === 1 ? "" : "s"} (${fmtDate(tenant.pendingDeletionAt)}) unless reactivated.`
                  : "Retention window has passed."}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="mt-4">
          <Card className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
            {(Object.keys(MODULE_LABELS) as ModuleKey[]).map((key) => {
              const active = plan?.modules.includes(key) ?? false;
              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-3 text-[12.5px]",
                    active ? "border-green-t bg-green-l text-green" : "border-border text-text-4"
                  )}
                >
                  {active ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                  {MODULE_LABELS[key]}
                </div>
              );
            })}
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card className="gap-0 p-0">
            {activity.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-text-4">No activity recorded for this tenant yet.</div>
            ) : (
              activity.map((entry) => <AuditLogRow key={entry.id} entry={entry} hideTenant />)
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title={`Suspend ${tenant.name}?`}
        description="The tenant is switched to read-only immediately — their team can view data but not make changes, per the no-grace-period suspension policy."
        confirmLabel="Suspend tenant"
        destructive
        onConfirm={() => tenantsApi.suspend(tenant.id)}
        successMessage={`${tenant.name} suspended (read-only)`}
      />
      <ConfirmDialog
        open={reactivateOpen}
        onOpenChange={setReactivateOpen}
        title={`Reactivate ${tenant.name}?`}
        description="Restores full access immediately and clears any pending-deletion countdown."
        confirmLabel="Reactivate tenant"
        onConfirm={() => tenantsApi.reactivate(tenant.id)}
        successMessage={`${tenant.name} reactivated`}
      />
      <AddSeatsDialog open={addSeatsOpen} onOpenChange={setAddSeatsOpen} tenantId={tenant.id} tenantName={tenant.name} />
    </div>
  );
}
