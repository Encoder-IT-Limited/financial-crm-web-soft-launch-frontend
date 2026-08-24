"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { fmtDate } from "@/lib/format";
import type { Invoice } from "../../invoices/types";
import {
  fulfillableLines,
  invoiceFulfillmentStatus,
  totalFulfilledQuantity,
  totalOrderedQuantity,
  type InvoiceFulfillmentStatus,
} from "../types";
import { invoiceApi } from "../../invoices/api/invoices.service";
import { fulfillmentsApi } from "../api/fulfillments.service";
import { customersApi } from "../../../modules/crm/api/customers.service";
import { StatTiles } from "../../invoices/components/stat-tiles";
import { FulfillmentStatusBadge } from "./fulfillment-status-badge";
import { FulfillmentDialog } from "./fulfillment-dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

type Filters = { search: string; status: "all" | InvoiceFulfillmentStatus };

const STATUS_OPTIONS: InvoiceFulfillmentStatus[] = ["unfulfilled", "partially-fulfilled", "fulfilled"];

/** Every invoice that has at least one product-linked line, with its
 * fulfillment progress — the standalone view for "what's left to ship,
 * what's the progress" (Phase I), since fulfilling itself stays an
 * action on the invoice, not a separate document type to create here. */
export function FulfillmentsList() {
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({ queryKey: ["invoices"], queryFn: invoiceApi.list });
  const { data: fulfillments = [], isLoading: fulfillmentsLoading } = useQuery({
    queryKey: ["fulfillments"],
    queryFn: () => fulfillmentsApi.list(),
  });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });

  const [filters, setFilters] = useState<Filters>({ search: "", status: "all" });
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";
  const fulfillmentsFor = (invoiceId: string) => fulfillments.filter((f) => f.invoiceId === invoiceId);

  const shippable = useMemo(() => invoices.filter((inv) => fulfillableLines(inv).length > 0), [invoices]);

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return shippable.filter((inv) => {
      const status = invoiceFulfillmentStatus(inv, fulfillmentsFor(inv.id));
      if (filters.status !== "all" && status !== filters.status) return false;
      if (needle && !`${inv.number} ${customerName(inv.customerId)}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippable, filters, customers, fulfillments]);

  const stats = useMemo(() => {
    const withStatus = shippable.map((inv) => invoiceFulfillmentStatus(inv, fulfillmentsFor(inv.id)));
    return {
      unfulfilled: withStatus.filter((s) => s === "unfulfilled").length,
      partial: withStatus.filter((s) => s === "partially-fulfilled").length,
      fulfilled: withStatus.filter((s) => s === "fulfilled").length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippable, fulfillments]);

  const columns = useMemo<AnyColumnDef<Invoice>[]>(
    () => [
      { accessorKey: "number", header: "Invoice #", cell: ({ row }) => <span className="font-bold text-text">{row.original.number}</span> },
      {
        id: "customer",
        accessorFn: (inv: Invoice) => customerName(inv.customerId),
        header: "Customer",
        cell: ({ row }) => customerName(row.original.customerId),
      },
      {
        id: "progress",
        header: "Progress",
        enableSorting: false,
        cell: ({ row }) => {
          const ordered = totalOrderedQuantity(row.original);
          const fulfilled = totalFulfilledQuantity(row.original, fulfillmentsFor(row.original.id));
          return (
            <span className="text-text-2">
              {fulfilled} / {ordered} units
            </span>
          );
        },
      },
      {
        id: "lastFulfilled",
        header: "Last Shipment",
        enableSorting: false,
        cell: ({ row }) => {
          const dates = fulfillmentsFor(row.original.id).map((f) => f.fulfilledAt);
          if (dates.length === 0) return <span className="text-text-4">—</span>;
          return fmtDate(dates.sort().at(-1)!);
        },
      },
      {
        id: "status",
        accessorFn: (inv: Invoice) => invoiceFulfillmentStatus(inv, fulfillmentsFor(inv.id)),
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => <FulfillmentStatusBadge status={invoiceFulfillmentStatus(row.original, fulfillmentsFor(row.original.id))} />,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customers, fulfillments]
  );

  return (
    <div>
      <PageHeading title="Delivery / Fulfillment" subtitle="What's shipped, what's remaining, across every product-linked invoice" />

      <div className="mb-4">
        <StatTiles
          tiles={[
            { label: "Unfulfilled", value: String(stats.unfulfilled), tone: "amber" },
            { label: "Partially Fulfilled", value: String(stats.partial), tone: "amber" },
            { label: "Fulfilled", value: String(stats.fulfilled), tone: "green" },
          ]}
        />
      </div>

      <FilterableTable
        columns={columns}
        data={filtered}
        loading={invoicesLoading || fulfillmentsLoading}
        getRowId={(inv) => inv.id}
        onRowClick={(inv) => setActiveInvoice(inv)}
        rowClassName="cursor-pointer"
        emptyState="No product-linked invoices match your filters. Fulfillment only applies to lines linked to a product via the Product Picker."
        search={{ value: filters.search, onChange: (search) => setFilters({ ...filters, search }), placeholder: "Search invoices..." }}
        filters={
          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: (v ?? "all") as Filters["status"] })}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  <FulfillmentStatusBadge status={status} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        onClearFilters={() => setFilters({ search: "", status: "all" })}
      />

      <FulfillmentDialog invoice={activeInvoice} open={!!activeInvoice} onOpenChange={(open) => !open && setActiveInvoice(null)} />
    </div>
  );
}
