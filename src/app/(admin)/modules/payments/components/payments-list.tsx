"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { fmtDate, fmtMoney } from "@/lib/format";
import { toast } from "@/lib/toast";
import { paymentsApi } from "../api/payments.service";
import { PaymentStatusBadge } from "./payment-status-badge";
import { PaymentDetailsDialog } from "./payment-details-dialog";
import type { PaymentStatus, PaymentTransaction } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

type Filters = { search: string; tenant: string; status: "all" | PaymentStatus; from: string; to: string };

const STATUS_OPTIONS: PaymentStatus[] = ["paid", "pending", "failed", "refunded"];

export function PaymentsList() {
  const { data: payments = [], isLoading: loading } = useQuery({ queryKey: ["payments"], queryFn: paymentsApi.list });
  const [filters, setFilters] = useState<Filters>({ search: "", tenant: "all", status: "all", from: "", to: "" });
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const tenants = useMemo(
    () => Array.from(new Set(payments.map((p) => p.tenantName))).sort(),
    [payments]
  );

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return payments.filter((p) => {
      if (filters.tenant !== "all" && p.tenantName !== filters.tenant) return false;
      if (filters.status !== "all" && p.status !== filters.status) return false;
      if (filters.from && p.date.slice(0, 10) < filters.from) return false;
      if (filters.to && p.date.slice(0, 10) > filters.to) return false;
      if (needle) {
        const haystack = `${p.reference} ${p.tenantName} ${p.planName}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [payments, filters]);

  function handleDownload(payment: PaymentTransaction) {
    toast.info(`${payment.reference} — invoice download will be available once the billing backend is connected`);
  }

  const columns = useMemo<AnyColumnDef<PaymentTransaction>[]>(
    () => [
      {
        accessorKey: "tenantName",
        header: "Tenant",
        cell: ({ row }) => <span className="font-bold text-text">{row.original.tenantName}</span>,
      },
      {
        id: "plan",
        accessorFn: (p: PaymentTransaction) => p.planName,
        header: "Plan/Subscription",
        cell: ({ row }) => (
          <span className="text-[12.5px] text-text-2 min-[1440px]:text-[13.5px]">{row.original.planName}</span>
        ),
      },
      {
        id: "amount",
        accessorFn: (p: PaymentTransaction) => p.amount,
        header: "Amount",
        cell: ({ row }) => (
          <span className="text-[13px] font-semibold text-text min-[1440px]:text-[14px]">
            {fmtMoney(row.original.amount)}
          </span>
        ),
      },
      {
        id: "method",
        accessorFn: (p: PaymentTransaction) => p.method,
        header: "Method",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-[12.5px] text-text-2 uppercase min-[1440px]:text-[13.5px]">{row.original.method}</span>
        ),
      },
      {
        id: "status",
        accessorFn: (p: PaymentTransaction) => p.status,
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => <PaymentStatusBadge status={row.original.status} />,
      },
      {
        id: "date",
        accessorFn: (p: PaymentTransaction) => p.date,
        header: "Date",
        cell: ({ row }) => (
          <span className="text-[12.5px] text-text-3 min-[1440px]:text-[13.5px]">{fmtDate(row.original.date)}</span>
        ),
      },
      {
        id: "invoice",
        header: "Invoice",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Download invoice for ${row.original.reference}`}
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(row.original);
            }}
          >
            <Download />
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div>
      <PageHeading title="Payments" subtitle="Track platform-wide billing and payments" />

      <FilterableTable
        columns={columns}
        data={filtered}
        loading={loading}
        getRowId={(p) => p.id}
        onRowClick={(p) => setDetailsId(p.id)}
        rowClassName="cursor-pointer"
        emptyState="No transactions match your filters."
        search={{
          value: filters.search,
          onChange: (search) => setFilters({ ...filters, search }),
          placeholder: "Search reference, tenant, plan...",
        }}
        filters={
          <>
            <Select value={filters.tenant} onValueChange={(v) => setFilters({ ...filters, tenant: v ?? "all" })}>
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tenants</SelectItem>
                {tenants.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters({ ...filters, status: (v ?? "all") as Filters["status"] })}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    <PaymentStatusBadge status={status} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="w-[140px]"
              aria-label="From date"
            />
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="w-[140px]"
              aria-label="To date"
            />
          </>
        }
        onClearFilters={() => setFilters({ search: "", tenant: "all", status: "all", from: "", to: "" })}
      />

      {detailsId && (
        <PaymentDetailsDialog
          open={!!detailsId}
          onOpenChange={(open) => !open && setDetailsId(null)}
          paymentId={detailsId}
        />
      )}
    </div>
  );
}
