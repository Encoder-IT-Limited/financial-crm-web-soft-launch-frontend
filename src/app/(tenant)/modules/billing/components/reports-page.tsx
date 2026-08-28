"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { StatTiles } from "./stat-tiles";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { fmtDate, fmtMoney } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";
import { useTenantCurrency } from "@/lib/use-tenant-currency";
import { customersApi } from "../../crm/api/customers.service";
import { invoiceApi } from "../api/invoices.service";
import { billingKeys } from "../query-keys";
import { crmKeys } from "../../crm/query-keys";
import { invoiceBalance, invoiceDisplayStatus, type Invoice, type InvoiceDisplayStatus } from "../types";
import { useCustomerStatement } from "../../crm/hooks/use-customers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

export function ReportsPage() {
  return (
    <div>
      <PageHeading title="All Reports" subtitle="Browse every available report" />

      <Tabs defaultValue="sales">
        <TabsList variant="line">
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="invoices">Invoice Report</TabsTrigger>
          <TabsTrigger value="statement">Customer Statement</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4">
          <SalesReport />
        </TabsContent>
        <TabsContent value="invoices" className="mt-4">
          <InvoiceReport />
        </TabsContent>
        <TabsContent value="statement" className="mt-4">
          <CustomerStatement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SalesReport() {
  const currency = useTenantCurrency();
  const { data, isLoading } = useQuery({
    queryKey: billingKeys.invoiceSummary(12),
    queryFn: () => invoiceApi.summary(12),
  });

  const months = data?.months ?? [];
  const totals = data?.totals ?? { invoiced: 0, collected: 0, outstanding: 0 };

  function exportCsv() {
    downloadCsv(
      "sales-report.csv",
      ["Month", "Invoiced", "Collected"],
      months.map((m) => [m.label, m.invoiced, m.collected])
    );
  }

  if (isLoading) return <div className="h-64 animate-pulse rounded-[10px] border border-border bg-surface-subtle" />;

  return (
    <div className="flex flex-col gap-4">
      <StatTiles
        tiles={[
          { label: "Total Invoiced", value: fmtMoney(totals.invoiced, currency), tone: "blue" },
          { label: "Total Collected", value: fmtMoney(totals.collected, currency), tone: "green" },
          { label: "Outstanding", value: fmtMoney(totals.outstanding, currency), tone: "amber" },
        ]}
      />

      <Card className="gap-0 p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="text-sm font-bold text-text">Monthly invoiced vs. collected (last 12 months)</div>
          <Button variant="outline" size="xs" onClick={exportCsv}>
            <Download /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-surface-subtle text-left text-[10.5px] font-bold uppercase tracking-wide text-text-4">
                <th className="px-5 py-2.5">Month</th>
                <th className="px-5 py-2.5 text-right">Invoiced</th>
                <th className="px-5 py-2.5 text-right">Collected</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.key} className="border-t border-border">
                  <td className="px-5 py-2.5 text-text-2">{m.label}</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-text">{fmtMoney(m.invoiced, currency)}</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-green">{fmtMoney(m.collected, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function InvoiceReport() {
  const [status, setStatus] = useState<"all" | InvoiceDisplayStatus>("all");
  const { data: fetched = [], isLoading } = useQuery({
    queryKey: billingKeys.invoicesPage({ status, report: true }),
    // "overdue" isn't a stored invoice status — the backend computes it as
    // its own boolean param instead of a `status` value (see
    // InvoiceListParams.overdue), and live-testing found that param
    // unreliable (`?overdue=true` and `?overdue=false` both sometimes
    // return the full unfiltered list). Ask for it as a best-effort
    // narrowing, but don't depend on it — see the client-side filter below,
    // which is what actually guarantees a correct result either way.
    queryFn: () =>
      invoiceApi.list(
        status === "all" ? {} : status === "overdue" ? { overdue: true } : { status }
      ),
  });
  const invoices = status === "overdue" ? fetched.filter((inv) => invoiceDisplayStatus(inv) === "overdue") : fetched;
  const { data: customers = [] } = useQuery({ queryKey: crmKeys.customers(), queryFn: customersApi.list });

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";

  const columns: AnyColumnDef<Invoice>[] = [
    { accessorKey: "number", header: "Invoice #", cell: ({ row }) => <span className="font-bold text-text">{row.original.number}</span> },
    { id: "customer", accessorFn: (i: Invoice) => customerName(i.customerId), header: "Customer", cell: ({ row }) => customerName(row.original.customerId) },
    { id: "issueDate", accessorFn: (i: Invoice) => i.issueDate, header: "Issue Date", cell: ({ row }) => fmtDate(row.original.issueDate) },
    { id: "total", accessorFn: (i: Invoice) => i.total, header: "Total", cell: ({ row }) => fmtMoney(row.original.total, row.original.currency) },
    { id: "paid", accessorFn: (i: Invoice) => i.paidAmount, header: "Paid", cell: ({ row }) => fmtMoney(row.original.paidAmount, row.original.currency) },
    {
      id: "balance",
      accessorFn: (i: Invoice) => invoiceBalance(i),
      header: "Balance",
      cell: ({ row }) => {
        const balance = invoiceBalance(row.original);
        return <span className={cn(balance > 0 && "font-semibold text-amber")}>{fmtMoney(balance, row.original.currency)}</span>;
      },
    },
    {
      id: "status",
      accessorFn: (i: Invoice) => invoiceDisplayStatus(i),
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => <InvoiceStatusBadge status={invoiceDisplayStatus(row.original)} />,
    },
  ];

  function exportCsv() {
    downloadCsv(
      "invoice-report.csv",
      ["Invoice #", "Customer", "Issue Date", "Total", "Paid", "Balance", "Status"],
      invoices.map((inv) => [
        inv.number,
        customerName(inv.customerId),
        fmtDate(inv.issueDate),
        inv.total,
        inv.paidAmount,
        invoiceBalance(inv),
        invoiceDisplayStatus(inv),
      ])
    );
  }

  return (
    <FilterableTable
      columns={columns}
      data={invoices}
      loading={isLoading}
      getRowId={(inv) => inv.id}
      emptyState="No invoices match your filters."
      actions={
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download /> Export CSV
        </Button>
      }
      filters={
        <Select value={status} onValueChange={(v) => setStatus((v ?? "all") as typeof status)}>
          <SelectTrigger size="sm">
            <SelectValue>
              {(v: typeof status) =>
                ({
                  all: "All status",
                  draft: "Draft",
                  sent: "Sent",
                  "partially-paid": "Partially Paid",
                  paid: "Paid",
                  overdue: "Overdue",
                  cancelled: "Cancelled",
                })[v] ?? "All status"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="partially-paid">Partially Paid</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      }
      onClearFilters={() => setStatus("all")}
      mobileCard={(inv) => {
        const balance = invoiceBalance(inv);
        return (
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-text">{inv.number}</span>
                <span className="text-[12px] text-text-3">{customerName(inv.customerId)}</span>
              </div>
              <InvoiceStatusBadge status={invoiceDisplayStatus(inv)} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-text-2">
              <span>{fmtMoney(inv.total, inv.currency)} total</span>
              <span>{fmtMoney(inv.paidAmount, inv.currency)} paid</span>
              <span className={cn(balance > 0 && "font-semibold text-amber")}>
                {fmtMoney(balance, inv.currency)} balance
              </span>
              <span className="ml-auto text-[11px] text-text-4">{fmtDate(inv.issueDate)}</span>
            </div>
          </div>
        );
      }}
    />
  );
}

function CustomerStatement() {
  const { data: customers = [] } = useQuery({ queryKey: crmKeys.customers(), queryFn: customersApi.list });
  const [customerId, setCustomerId] = useState("");
  const { data: statement, isLoading } = useCustomerStatement(customerId);

  const customer = customers.find((c) => c.id === customerId);
  const currency = statement?.currency ?? customer?.currency;
  const opening = statement?.openingBalance ?? customer?.openingBalance ?? 0;
  const closingBalance = statement?.closingBalance ?? opening;
  const rows = statement?.rows ?? [];

  function exportCsv() {
    if (!customer) return;
    downloadCsv(
      `statement-${customer.customerCode}.csv`,
      ["Date", "Description", "Charge", "Credit", "Balance"],
      [
        ["", "Opening Balance", "", "", opening],
        ...rows.map((r) => [fmtDate(r.date), r.description, r.charge || "", r.credit || "", r.balance]),
      ]
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="w-full max-w-xs">
            <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a customer">
                  {(v: string | null) => customers.find((c) => c.id === v)?.name ?? "Select a customer"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {customer && (
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download /> Export CSV
            </Button>
          )}
        </div>
      </Card>

      {customer && isLoading && (
        <div className="h-64 animate-pulse rounded-[10px] border border-border bg-surface-subtle" />
      )}

      {customer && statement && (
        <>
          <StatTiles
            tiles={[
              { label: "Opening Balance", value: fmtMoney(opening, currency), tone: "neutral" },
              { label: "Closing Balance", value: fmtMoney(closingBalance, currency), tone: closingBalance > 0 ? "amber" : "green" },
            ]}
          />

          <Card className="gap-0 p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="bg-surface-subtle text-left text-[10.5px] font-bold uppercase tracking-wide text-text-4">
                    <th className="px-5 py-2.5">Date</th>
                    <th className="px-5 py-2.5">Description</th>
                    <th className="px-5 py-2.5 text-right">Charge</th>
                    <th className="px-5 py-2.5 text-right">Credit</th>
                    <th className="px-5 py-2.5 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-5 py-2.5 text-text-4" colSpan={4}>
                      Opening Balance
                    </td>
                    <td className="px-5 py-2.5 text-right font-semibold text-text">{fmtMoney(opening, currency)}</td>
                  </tr>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-border">
                      <td className="px-5 py-2.5 text-text-3">{fmtDate(row.date)}</td>
                      <td className="px-5 py-2.5 text-text-2">{row.description}</td>
                      <td className="px-5 py-2.5 text-right text-text">{row.charge > 0 ? fmtMoney(row.charge, currency) : "—"}</td>
                      <td className="px-5 py-2.5 text-right text-green">{row.credit > 0 ? fmtMoney(row.credit, currency) : "—"}</td>
                      <td className="px-5 py-2.5 text-right font-semibold text-text">{fmtMoney(row.balance, currency)}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr className="border-t border-border">
                      <td colSpan={5} className="px-5 py-8 text-center text-text-4">
                        No transactions for this customer yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
