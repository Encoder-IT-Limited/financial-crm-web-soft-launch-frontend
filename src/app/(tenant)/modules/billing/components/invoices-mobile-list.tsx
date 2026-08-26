"use client";

import Link from "next/link";
import { fmtDate, fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { invoiceBalance, invoiceDisplayStatus, type Invoice } from "../types";
import { InvoiceStatusBadge } from "./invoice-status-badge";

export function InvoicesMobileList({
  invoices,
  customerName,
  loading = false,
  error,
}: {
  invoices: Invoice[];
  customerName: (id: string) => string;
  loading?: boolean;
  error?: string;
}) {
  if (loading) {
    return (
      <div className="flex flex-col divide-y divide-border lg:hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="flex flex-col gap-2.5 p-4">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full max-w-56" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-[13px] text-red lg:hidden">{error}</div>;
  }

  return (
    <div className="flex flex-col divide-y divide-border lg:hidden">
      {invoices.map((inv) => (
        <Link
          key={inv.id}
          href={`/dashboard/invoices/${inv.id}`}
          className="flex flex-col gap-2.5 p-4 transition-colors hover:bg-surface-subtle"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-bold text-text">{inv.number}</span>
            <InvoiceStatusBadge status={invoiceDisplayStatus(inv)} />
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-text-2">
            <span className="truncate">{customerName(inv.customerId)}</span>
          </div>
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="text-text-4">
              Issued {fmtDate(inv.issueDate)} · Due {fmtDate(inv.dueDate)}
            </span>
            <div className="text-right">
              <div className="font-bold text-text">{fmtMoney(inv.total, inv.currency)}</div>
              <div className="text-[11px] text-text-3">
                Balance{" "}
                <span className={cn("font-semibold", invoiceBalance(inv) > 0 ? "text-amber" : "text-green")}>
                  {fmtMoney(invoiceBalance(inv), inv.currency)}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
      {invoices.length === 0 && (
        <div className="p-8 text-center text-[13px] text-text-4">No invoices match your filters.</div>
      )}
    </div>
  );
}
