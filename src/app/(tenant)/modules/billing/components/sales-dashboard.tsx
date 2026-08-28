"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fmtDate, fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  invoiceBalance,
  invoiceDisplayStatus,
  isInvoiceOverdue,
  PAYMENT_METHOD_LABELS,
  type InvoiceDisplayStatus,
} from "../types";
import { invoiceApi } from "../api/invoices.service";
import { customersApi } from "../../crm/api/customers.service";
import { StatTiles, TONE_SOLID_BG } from "./stat-tiles";
import { InvoiceStatusBadge, STATUS_CONFIG } from "./invoice-status-badge";

/** Sales Dashboard (docs/inv-pos-hr-tenant.md §6) — KPIs, 6-month invoicing
 *  trend, status breakdown, quick actions and recent activity, all derived
 *  from the live billing services. */
export function SalesDashboard() {
  const { data: invoices = [], isLoading } = useQuery({ queryKey: ["invoices"], queryFn: () => invoiceApi.list() });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";

  const stats = useMemo(() => {
    const live = invoices.filter((inv) => inv.status !== "cancelled");
    const totalInvoiced = live.reduce((sum, inv) => sum + inv.total, 0);
    const outstanding = live.reduce((sum, inv) => sum + invoiceBalance(inv), 0);
    const overdue = invoices.filter(isInvoiceOverdue).reduce((sum, inv) => sum + invoiceBalance(inv), 0);
    const collected = live.reduce((sum, inv) => sum + inv.paidAmount, 0);
    return { totalInvoiced, outstanding, overdue, collected };
  }, [invoices]);

  /** Invoiced totals for the last 6 months, bucketed by issue date. */
  const trend = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("en", { month: "short" }),
        total: 0,
      });
    }
    for (const inv of invoices) {
      if (inv.status === "cancelled") continue;
      const bucket = buckets.find((b) => b.key === inv.issueDate.slice(0, 7));
      if (bucket) bucket.total += inv.total;
    }
    return buckets;
  }, [invoices]);

  const trendMax = Math.max(1, ...trend.map((b) => b.total));
  const trendSummary = trend.map((b) => `${b.label} ${fmtMoney(b.total)}`).join(", ");

  const statusBreakdown = useMemo(() => {
    const order: InvoiceDisplayStatus[] = ["draft", "sent", "partially-paid", "overdue", "paid", "cancelled"];
    const counts = new Map<InvoiceDisplayStatus, number>();
    for (const inv of invoices) {
      const status = invoiceDisplayStatus(inv);
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    const rows = order
      .map((status) => ({ status, count: counts.get(status) ?? 0 }))
      .filter((row) => row.count > 0);
    const max = Math.max(1, ...rows.map((r) => r.count));
    return { rows, max };
  }, [invoices]);

  const recentPayments = useMemo(() => {
    return invoices
      .flatMap((inv) => inv.payments.map((payment) => ({ ...payment, invoiceNumber: inv.number, currency: inv.currency })))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 5);
  }, [invoices]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    // fade in once real content replaces the skeleton, instead of the
    // structure just popping in — the one continuity moment this page needs.
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
      <StatTiles
        tiles={[
          { label: "Total Invoiced", value: fmtMoney(stats.totalInvoiced), tone: "blue", sub: "excl. cancelled" },
          { label: "Outstanding", value: fmtMoney(stats.outstanding), tone: "amber", sub: "balance due" },
          {
            label: "Overdue",
            value: fmtMoney(stats.overdue),
            tone: "red",
            sub: "past due date",
            // Color dosage encodes urgency: only the tile that actually
            // needs attention right now gets the stronger treatment.
            urgent: stats.overdue > 0,
          },
          { label: "Collected", value: fmtMoney(stats.collected), tone: "green", sub: "payments received" },
        ]}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="gap-3 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-text">Invoicing trend</div>
            <div className="text-[11px] text-text-4">last 6 months</div>
          </div>
          <div
            role="img"
            aria-label={`Invoicing trend for the last 6 months: ${trendSummary}`}
            className="flex h-36 items-end gap-3"
          >
            {trend.map((bucket, i) => (
              <div
                key={bucket.key}
                style={{ animationDelay: `${i * 40}ms` }}
                className="motion-safe:fill-mode-both motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              >
                <span className="text-[10px] font-semibold text-text-3">
                  {bucket.total > 0 ? `${Math.round(bucket.total / 1000)}k` : "—"}
                </span>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <div className="flex min-h-4 w-full flex-1 items-end rounded-md bg-surface-subtle" />
                    }
                  >
                    <div
                      className="chart-bar-fill w-full rounded-md bg-blue transition-[height] duration-300"
                      style={{ height: `${Math.max(4, (bucket.total / trendMax) * 100)}%`, animationDelay: `${i * 40}ms` }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {bucket.label}: {fmtMoney(bucket.total)}
                  </TooltipContent>
                </Tooltip>
                <span className="text-[10.5px] text-text-4">{bucket.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="gap-3 p-5">
          <div className="text-sm font-bold text-text">Invoices by status</div>
          <div className="flex flex-col gap-2.5">
            {statusBreakdown.rows.length === 0 && <EmptyNote>No invoices yet.</EmptyNote>}
            {statusBreakdown.rows.map(({ status, count }, i) => (
              <div key={status}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <InvoiceStatusBadge status={status} />
                  <span className="font-semibold text-text-2">{count}</span>
                </div>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-subtle" />
                    }
                  >
                    <div
                      className={cn(
                        "status-bar-fill h-full rounded-full transition-[width] duration-300",
                        TONE_SOLID_BG[STATUS_CONFIG[status].tone]
                      )}
                      style={{ width: `${(count / statusBreakdown.max) * 100}%`, animationDelay: `${i * 40}ms` }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {STATUS_CONFIG[status].label}: {count} invoice{count === 1 ? "" : "s"}
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="gap-0 p-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="text-sm font-bold text-text">Recent invoices</div>
            <Link href="/dashboard/invoices" className={buttonVariants({ variant: "ghost", size: "xs" })}>
              View all <ArrowRight />
            </Link>
          </div>
          {invoices.length === 0 ? (
            <EmptyNote className="px-5">No invoices yet.</EmptyNote>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {invoices.slice(0, 5).map((inv) => (
                <Link
                  key={inv.id}
                  href={`/dashboard/invoices/${inv.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-surface-subtle"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-text">{inv.number}</div>
                    <div className="truncate text-[11px] text-text-3">{customerName(inv.customerId)}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[12.5px] font-semibold text-text">{fmtMoney(inv.total, inv.currency)}</span>
                    <InvoiceStatusBadge status={invoiceDisplayStatus(inv)} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="gap-0 p-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="text-sm font-bold text-text">Recent payments</div>
            <Link href="/dashboard/invoices" className={buttonVariants({ variant: "ghost", size: "xs" })}>
              View all <ArrowRight />
            </Link>
          </div>
          {recentPayments.length === 0 ? (
            <EmptyNote className="px-5">No payments recorded yet.</EmptyNote>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                  <div>
                    <div className="text-[13px] font-semibold text-green">{fmtMoney(payment.amount, payment.currency)}</div>
                    <div className="mt-0.5 text-[11px] text-text-3">
                      <FileText className="mr-1 inline size-3 align-[-1px]" />
                      {payment.invoiceNumber} · {PAYMENT_METHOD_LABELS[payment.method]}
                      {payment.reference ? ` · ${payment.reference}` : ""}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11.5px] text-text-4">{fmtDate(payment.date)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/** Shared empty-state note — same text style everywhere it's used; the
 * padding stays a prop because the two contexts genuinely differ (the
 * status-breakdown card already has its own p-5 via `Card`, the recent
 * invoices/payments cards are p-0 and need their own px-5 inset). */
function EmptyNote({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("py-6 text-center text-[12.5px] text-text-4", className)}>{children}</div>;
}

/** Per-region skeleton matching the real layout below, instead of one
 * placeholder block standing in for the whole page — so structure is
 * visible immediately, not just "something is loading." */
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 rounded-[10px] bg-surface-subtle p-3.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-3 p-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-36 w-full" />
        </Card>
        <Card className="gap-3 p-5">
          <Skeleton className="h-4 w-32" />
          <div className="flex flex-col gap-3 py-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="gap-0 p-0">
            <div className="border-b border-border px-5 py-3">
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex flex-col gap-3 p-5">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-8 w-full" />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
