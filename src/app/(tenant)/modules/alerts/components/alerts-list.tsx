"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/shared/page-heading";
import { cn } from "@/lib/utils";
import { alertsApi } from "../api/alerts.service";
import type { Alert } from "../types";

const SEVERITY_STYLES: Record<Alert["severity"], { icon: typeof AlertTriangle; className: string }> = {
  warning: { icon: AlertTriangle, className: "border-amber-t bg-amber-l text-amber" },
  info: { icon: Info, className: "border-blue-t bg-blue-l text-blue" },
};

/** Retainer expiry/low-balance (Phase H4) and fulfillment pending-
 * reconciliation (Phase I-E) alerts, computed live. Not a general-purpose
 * alerting system for the rest of the app; extend `alertsApi.list()`
 * if/when other trigger sources are added. */
export function AlertsList() {
  const { data: alerts = [], isLoading } = useQuery({ queryKey: ["alerts"], queryFn: alertsApi.list });

  return (
    <div>
      <PageHeading title="Alerts" subtitle="Stay on top of retainer contracts, invoices, and stock that need a look" />

      {isLoading && <div className="p-8 text-center text-[13px] text-text-4">Loading alerts…</div>}

      {!isLoading && alerts.length === 0 && (
        <Card className="p-8 text-center text-[13px] text-text-4">Nothing needs attention right now.</Card>
      )}

      <div className="flex flex-col gap-2.5">
        {alerts.map((alert) => {
          const { icon: Icon, className } = SEVERITY_STYLES[alert.severity];
          const href = alert.relatedInvoiceId
            ? `/dashboard/invoices/${alert.relatedInvoiceId}`
            : "/dashboard/retainers";
          const linkLabel = alert.relatedInvoiceId ? "View invoice" : "View retainers";
          return (
            <Card key={alert.id} className={cn("flex flex-row items-start gap-3 border p-4", className)}>
              <Icon className="mt-0.5 size-4 shrink-0" />
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-text">{alert.title}</div>
                <p className="mt-0.5 text-[12px] text-text-2">{alert.message}</p>
              </div>
              <Link href={href} className="shrink-0 text-[11.5px] font-semibold underline-offset-2 hover:underline">
                {linkLabel}
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
