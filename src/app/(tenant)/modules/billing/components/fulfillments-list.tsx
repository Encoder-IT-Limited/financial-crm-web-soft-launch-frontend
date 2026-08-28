"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtDate, fmtQty } from "@/lib/format";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { useInvoices } from "../hooks/use-invoices";
import { useCustomers } from "../../crm/hooks/use-customers";
import { invoiceApi } from "../api/invoices.service";
import { billingKeys } from "../query-keys";
import {
  fulfillableLines,
  invoiceFulfillmentStatus,
  totalFulfilledQuantity,
  totalOrderedQuantity,
  type Invoice,
  type InvoiceFulfillmentStatus,
} from "../types";
import { FulfillmentDialog } from "./fulfillment-dialog";
import { FulfillmentStatusBadge } from "./fulfillment-status-badge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

type Filters = { search: string; status: "all" | InvoiceFulfillmentStatus };

const STATUS_OPTIONS: InvoiceFulfillmentStatus[] = ["unfulfilled", "partially-fulfilled", "fulfilled"];

export function FulfillmentsList() {
  const queryClient = useQueryClient();
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: allFulfillments = [] } = useQuery({
    queryKey: billingKeys.fulfillments(),
    queryFn: () => invoiceApi.listFulfillments(),
  });
  const { data: customers = [] } = useCustomers();
  const [filters, setFilters] = useState<Filters>({ search: "", status: "all" });
  const [fulfillInvoice, setFulfillInvoice] = useState<Invoice | null>(null);
  const [busy, setBusy] = useState(false);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";

  const fulfillableInvoices = useMemo(() => {
    const byInvoice = new Map<string, typeof allFulfillments>();
    for (const f of allFulfillments) {
      const list = byInvoice.get(f.invoiceId) ?? [];
      list.push(f);
      byInvoice.set(f.invoiceId, list);
    }
    return invoices
      .filter((inv) => fulfillableLines(inv).length > 0 && inv.status !== "draft" && inv.status !== "cancelled")
      .map((inv) => ({ ...inv, fulfillments: byInvoice.get(inv.id) ?? inv.fulfillments ?? [] }));
  }, [invoices, allFulfillments]);

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return fulfillableInvoices.filter((inv) => {
      const status = invoiceFulfillmentStatus(inv);
      if (filters.status !== "all" && status !== filters.status) return false;
      if (needle && !`${inv.number} ${customerName(inv.customerId)}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fulfillableInvoices, filters, customers]);

  const columns = useMemo<AnyColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: "number",
        header: "Invoice #",
        cell: ({ row }) => (
          <Link href={`/dashboard/invoices/${row.original.id}`} className="font-bold text-blue hover:underline">
            {row.original.number}
          </Link>
        ),
      },
      {
        id: "customer",
        accessorFn: (inv: Invoice) => customerName(inv.customerId),
        header: "Customer",
      },
      {
        id: "progress",
        header: "Shipped / Ordered",
        cell: ({ row }) => {
          const ordered = totalOrderedQuantity(row.original);
          const fulfilled = totalFulfilledQuantity(row.original);
          return `${fmtQty(fulfilled)} / ${fmtQty(ordered)}`;
        },
      },
      {
        id: "lastShipment",
        header: "Last shipment",
        cell: ({ row }) => {
          const latest = row.original.fulfillments?.[0]?.fulfilledAt;
          return latest ? fmtDate(latest.slice(0, 10)) : "—";
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <FulfillmentStatusBadge status={invoiceFulfillmentStatus(row.original)} />,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customers],
  );

  async function handleFulfill(input: Parameters<typeof invoiceApi.fulfill>[1]) {
    if (!fulfillInvoice) return;
    setBusy(true);
    try {
      await invoiceApi.fulfill(fulfillInvoice.id, input);
      queryClient.invalidateQueries({ queryKey: billingKeys.invoices() });
      queryClient.invalidateQueries({ queryKey: billingKeys.invoice(fulfillInvoice.id) });
      queryClient.invalidateQueries({ queryKey: billingKeys.fulfillments(fulfillInvoice.id) });
      queryClient.invalidateQueries({ queryKey: billingKeys.pendingReconciliation() });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success(`${fulfillInvoice.number} fulfilled`);
      setFulfillInvoice(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Fulfillment failed");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeading
        title="Delivery / Fulfillment"
        subtitle="Track product shipments and delivery progress across invoices"
      />

      <FilterableTable
        data={filtered}
        columns={columns}
        loading={isLoading}
        getRowId={(inv) => inv.id}
        onRowClick={(inv) => setFulfillInvoice(inv)}
        rowClassName="cursor-pointer"
        emptyState="No invoices with product lines match your filters."
        search={{
          value: filters.search,
          onChange: (search) => setFilters((f) => ({ ...f, search })),
          placeholder: "Search invoice or customer…",
        }}
        filters={
          <Select
            value={filters.status}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: (v ?? "all") as Filters["status"] }))}
          >
            <SelectTrigger size="sm" className="w-[180px]">
              <SelectValue placeholder="Status">
                {(v: Filters["status"]) => (v === "all" || !v ? "All statuses" : v.replace(/-/g, " "))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/-/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        mobileCard={(inv) => {
          const ordered = totalOrderedQuantity(inv);
          const fulfilled = totalFulfilledQuantity(inv);
          const latest = inv.fulfillments?.[0]?.fulfilledAt;
          return (
            <div className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-text">{inv.number}</span>
                  <span className="text-[12px] text-text-3">{customerName(inv.customerId)}</span>
                </div>
                <FulfillmentStatusBadge status={invoiceFulfillmentStatus(inv)} />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-text-4">
                <span>{fmtQty(fulfilled)} / {fmtQty(ordered)} shipped</span>
                <span>Last shipment: {latest ? fmtDate(latest.slice(0, 10)) : "—"}</span>
              </div>
            </div>
          );
        }}
      />

      <FulfillmentDialog
        invoice={fulfillInvoice}
        open={Boolean(fulfillInvoice)}
        onOpenChange={(open) => !open && setFulfillInvoice(null)}
        onSubmit={handleFulfill}
        submitting={busy}
      />
    </div>
  );
}
