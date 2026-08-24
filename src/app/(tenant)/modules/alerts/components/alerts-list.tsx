"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/shared/page-heading";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { invoiceApi } from "../../billing/api/invoices.service";
import { billingKeys } from "../../billing/query-keys";
import { alertsApi } from "../api/alerts.service";
import type { Alert } from "../types";

const SEVERITY_STYLES: Record<Alert["severity"], { icon: typeof AlertTriangle; className: string }> = {
  warning: { icon: AlertTriangle, className: "border-amber-t bg-amber-l text-amber" },
  info: { icon: Info, className: "border-blue-t bg-blue-l text-blue" },
};

function alertLink(alert: Alert): { href: string; label: string } {
  if (alert.type === "fulfillment-pending-reconciliation" && alert.relatedInvoiceId) {
    return { href: `/dashboard/invoices/${alert.relatedInvoiceId}`, label: "View invoice" };
  }
  return { href: "/dashboard/retainers", label: "View retainers" };
}

export function AlertsList() {
  const qc = useQueryClient();
  const { data: alerts = [], isLoading } = useQuery({ queryKey: ["alerts"], queryFn: alertsApi.list });

  const reconcile = useMutation({
    mutationFn: (lineId: string) => invoiceApi.reconcileFulfillmentLine(lineId),
    onSuccess: async () => {
      toast.success("Marked reconciled");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["alerts"] }),
        qc.invalidateQueries({ queryKey: billingKeys.pendingReconciliation() }),
        qc.invalidateQueries({ queryKey: billingKeys.invoices() }),
      ]);
    },
    onError: (err: Error) => toast.error(err.message || "Could not reconcile"),
  });

  return (
    <div>
      <PageHeading
        title="Alerts"
        subtitle="Retainer contracts, low balances, and fulfillment items needing attention"
      />

      {isLoading && <div className="p-8 text-center text-[13px] text-text-4">Loading alerts…</div>}

      {!isLoading && alerts.length === 0 && (
        <Card className="p-8 text-center text-[13px] text-text-4">Nothing needs attention right now.</Card>
      )}

      <div className="flex flex-col gap-2.5">
        {alerts.map((alert) => {
          const { icon: Icon, className } = SEVERITY_STYLES[alert.severity];
          const link = alertLink(alert);
          return (
            <Card key={alert.id} className={cn("flex flex-row items-start gap-3 border p-4", className)}>
              <Icon className="mt-0.5 size-4 shrink-0" />
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-text">{alert.title}</div>
                <p className="mt-0.5 text-[12px] text-text-2">{alert.message}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                {alert.relatedFulfillmentLineId && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reconcile.isPending}
                    onClick={() => reconcile.mutate(alert.relatedFulfillmentLineId!)}
                  >
                    <CheckCircle2 /> Reconcile
                  </Button>
                )}
                <Link href={link.href} className="text-[11.5px] font-semibold underline-offset-2 hover:underline">
                  {link.label}
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
