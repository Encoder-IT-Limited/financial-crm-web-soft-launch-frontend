"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EntityDetailsDialog } from "@/components/shared/entity-details-dialog";
import { SeatMeter } from "@/components/shared/seat-meter";
import { StatusBadge } from "@/components/shared/status-badge";
import { MODULE_LABELS, type ModuleKey } from "@/lib/permissions";
import { daysFromNow, fmtDate, fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { auditApi } from "../../audit/api/audit.service";
import { AuditLogRow } from "../../audit/components/audit-log-row";
import { planApi } from "../../plans/api/plans.service";
import { tenantsApi } from "../api/tenants.service";
import { seatUsage, tenantMrr, TENANT_ROLE_LABELS } from "../types";
import { AddSeatsDialog } from "./add-seats-dialog";

export function TenantDetailsDialog({
  open,
  onOpenChange,
  tenantId,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: tenants = [] } = useQuery({ queryKey: ["tenants"], queryFn: tenantsApi.list });
  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: planApi.list });
  const { data: entries = [] } = useQuery({ queryKey: ["audit"], queryFn: auditApi.list });
  const tenant = tenants.find((t) => t.id === tenantId);
  const activity = useMemo(() => entries.filter((entry) => entry.tenantId === tenantId), [entries, tenantId]);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [addSeatsOpen, setAddSeatsOpen] = useState(false);

  if (!tenant) return null;

  const plan = plans.find((p) => p.id === tenant.planId);
  const { used, total } = seatUsage(tenant, plan);
  const mrr = tenantMrr(tenant, plan);
  const retentionDaysLeft = tenant.pendingDeletionAt ? daysFromNow(tenant.pendingDeletionAt) : null;

  return (
    <>
      <EntityDetailsDialog
        open={open}
        onOpenChange={onOpenChange}
        title={tenant.name}
        subtitle={`${plan?.name ?? "Unknown plan"} · ${tenant.billingCycle === "monthly" ? "Monthly" : "Yearly"} billing`}
        statusSlot={<StatusBadge status={tenant.status} />}
        onEdit={onEdit}
        onDelete={onDelete}
      >
        <div className="flex flex-col gap-5 py-1">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="p-4">
              <div className="mb-1.5 text-[11px] font-semibold uppercase text-text-4 min-[1440px]:text-[12px]">Plan</div>
              <div className="text-lg font-extrabold text-text">{plan?.name ?? "—"}</div>
            </Card>
            <Card className="p-4">
              <div className="mb-1.5 text-[11px] font-semibold uppercase text-text-4 min-[1440px]:text-[12px]">MRR</div>
              <div className="text-lg font-extrabold text-text">{fmtMoney(mrr)}</div>
            </Card>
            <Card className="p-4">
              <div className="mb-1.5 text-[11px] font-semibold uppercase text-text-4 min-[1440px]:text-[12px]">Seats</div>
              <SeatMeter used={used} total={total} />
            </Card>
            <Card className="p-4">
              <div className="mb-1.5 text-[11px] font-semibold uppercase text-text-4 min-[1440px]:text-[12px]">Customer since</div>
              <div className="text-lg font-extrabold text-text">{fmtDate(tenant.createdAt)}</div>
            </Card>
          </div>

          <section>
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-text-4 min-[1440px]:text-[12px]">Company</h4>
            <Card className="grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase text-text-4 min-[1440px]:text-[12px]">Legal name</div>
                <div className="text-[13px] font-semibold text-text min-[1440px]:text-[14px]">{tenant.legalName}</div>
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase text-text-4 min-[1440px]:text-[12px]">Email</div>
                <div className="text-[13px] font-semibold text-text min-[1440px]:text-[14px]">{tenant.email}</div>
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase text-text-4 min-[1440px]:text-[12px]">Phone</div>
                <div className="text-[13px] font-semibold text-text min-[1440px]:text-[14px]">{tenant.phone}</div>
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase text-text-4 min-[1440px]:text-[12px]">Address</div>
                <div className="text-[13px] font-semibold text-text min-[1440px]:text-[14px]">{tenant.address}</div>
              </div>
            </Card>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-text-4 min-[1440px]:text-[12px]">Subscription</h4>
              {tenant.status === "active" ? (
                <Button variant="outline" size="xs" onClick={() => setSuspendOpen(true)}>
                  Suspend
                </Button>
              ) : (
                tenant.status !== "cancelled" && (
                  <Button variant="outline" size="xs" onClick={() => setReactivateOpen(true)}>
                    Reactivate
                  </Button>
                )
              )}
            </div>
            <Card className="gap-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase text-text-4 min-[1440px]:text-[12px]">Plan</div>
                  <div className="text-[13px] font-semibold text-text min-[1440px]:text-[14px]">{plan?.name ?? "—"}</div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase text-text-4 min-[1440px]:text-[12px]">Billing cycle</div>
                  <div className="text-[13px] font-semibold text-text min-[1440px]:text-[14px]">
                    {tenant.billingCycle === "monthly" ? "Monthly" : "Yearly"}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase text-text-4 min-[1440px]:text-[12px]">Renewal date</div>
                  <div className="text-[13px] font-semibold text-text min-[1440px]:text-[14px]">{fmtDate(tenant.renewalDate)}</div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase text-text-4 min-[1440px]:text-[12px]">Status</div>
                  <StatusBadge status={tenant.status} />
                </div>
              </div>
              {tenant.status === "pending-deletion" && (
                <div className="rounded-lg bg-red-l p-3 text-[12.5px] text-red min-[1440px]:text-[13.5px]">
                  {retentionDaysLeft !== null && retentionDaysLeft >= 0
                    ? `Permanently deleted in ${retentionDaysLeft} day${retentionDaysLeft === 1 ? "" : "s"} (${fmtDate(tenant.pendingDeletionAt)}) unless reactivated.`
                    : "Retention window has passed."}
                </div>
              )}
            </Card>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-text-4 min-[1440px]:text-[12px]">Seats</h4>
              <Button variant="outline" size="xs" onClick={() => setAddSeatsOpen(true)}>
                <Plus /> Add seats
              </Button>
            </div>
            <Card className="gap-0 p-0">
              <div className="flex flex-col divide-y divide-border">
                {tenant.users.map((user) => {
                  const counts = ["owner", "admin", "staff", "pos-cashier"].includes(user.role);
                  return (
                    <div key={user.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                      <div className="min-w-[160px]">
                        <div className="text-[12.5px] font-semibold text-text min-[1440px]:text-[13.5px]">
                          {user.name}
                        </div>
                        <div className="text-[11px] text-text-4 min-[1440px]:text-[12px]">{user.email}</div>
                      </div>
                      <Badge tone="neutral">{TENANT_ROLE_LABELS[user.role]}</Badge>
                      <span
                        className={cn(
                          "ml-auto text-[11px] font-semibold min-[1440px]:text-[12px]",
                          counts ? "text-blue" : "text-text-4"
                        )}
                      >
                        {counts ? "Counts toward seat" : "Doesn't count"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>

          <section>
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-text-4 min-[1440px]:text-[12px]">Modules</h4>
            <Card className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
              {(Object.keys(MODULE_LABELS) as ModuleKey[]).map((key) => {
                const active = plan?.modules.includes(key) ?? false;
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-3 text-[12.5px] min-[1440px]:text-[13.5px]",
                      active ? "border-green-t bg-green-l text-green" : "border-border text-text-4"
                    )}
                  >
                    {active ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                    {MODULE_LABELS[key]}
                  </div>
                );
              })}
            </Card>
          </section>

          <section>
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-text-4 min-[1440px]:text-[12px]">Activity</h4>
            <Card className="gap-0 p-0">
              {activity.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-text-4 min-[1440px]:text-[14px]">
                  No activity recorded for this tenant yet.
                </div>
              ) : (
                activity.map((entry) => <AuditLogRow key={entry.id} entry={entry} hideTenant />)
              )}
            </Card>
          </section>
        </div>
      </EntityDetailsDialog>

      <ConfirmDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title={`Suspend ${tenant.name}?`}
        description="The tenant is switched to read-only immediately — their team can view data but not make changes, per the no-grace-period suspension policy."
        confirmLabel="Suspend tenant"
        destructive
        onConfirm={async () => {
          await tenantsApi.suspend(tenant.id);
          queryClient.invalidateQueries({ queryKey: ["tenants"] });
          queryClient.invalidateQueries({ queryKey: ["audit"] });
        }}
        successMessage={`${tenant.name} suspended (read-only)`}
      />
      <ConfirmDialog
        open={reactivateOpen}
        onOpenChange={setReactivateOpen}
        title={`Reactivate ${tenant.name}?`}
        description="Restores full access immediately and clears any pending-deletion countdown."
        confirmLabel="Reactivate tenant"
        onConfirm={async () => {
          await tenantsApi.reactivate(tenant.id);
          queryClient.invalidateQueries({ queryKey: ["tenants"] });
          queryClient.invalidateQueries({ queryKey: ["audit"] });
        }}
        successMessage={`${tenant.name} reactivated`}
      />
      <AddSeatsDialog open={addSeatsOpen} onOpenChange={setAddSeatsOpen} tenantId={tenant.id} tenantName={tenant.name} />
    </>
  );
}
