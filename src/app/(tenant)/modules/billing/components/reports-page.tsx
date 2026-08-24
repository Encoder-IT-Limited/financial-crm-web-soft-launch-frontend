"use client";

import { useMemo, useState } from "react";
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
import { customersApi } from "../../crm/api/customers.service";
import { invoiceApi } from "../api/invoices.service";
import { adjustmentsApi } from "../api/adjustments.service";
import { billingKeys } from "../query-keys";
import { invoiceBalance, invoiceDisplayStatus, PAYMENT_METHOD_LABELS, type Invoice, type InvoiceDisplayStatus } from "../types";

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
  const { data: invoices = [], isLoading } = useQuery({ queryKey: ["invoices"], queryFn: invoiceApi.list });

  const months = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; invoiced: number; collected: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("en", { month: "short", year: "2-digit" }),
        invoiced: 0,
        collected: 0,
      });
    }
    for (const inv of invoices) {
      if (inv.status === "cancelled") continue;
      const bucket = buckets.find((b) => b.key === inv.issueDate.slice(0, 7));
      if (bucket) bucket.invoiced += inv.total;
      for (const payment of inv.payments) {
        const paymentBucket = buckets.find((b) => b.key === payment.date.slice(0, 7));
        if (paymentBucket) paymentBucket.collected += payment.amount;
      }
    }
    return buckets;
  }, [invoices]);

  const totals = useMemo(() => {
    const live = invoices.filter((inv) => inv.status !== "cancelled");
    const invoiced = live.reduce((sum, inv) => sum + inv.total, 0);
    const collected = live.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const outstanding = live.reduce((sum, inv) => sum + invoiceBalance(inv), 0);
    return { invoiced, collected, outstanding };
  }, [invoices]);

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
          { label: "Total Invoiced", value: fmtMoney(totals.invoiced), tone: "blue" },
          { label: "Total Collected", value: fmtMoney(totals.collected), tone: "green" },
          { label: "Outstanding", value: fmtMoney(totals.outstanding), tone: "amber" },
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
                  <td className="px-5 py-2.5 text-right font-semibold text-text">{fmtMoney(m.invoiced)}</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-green">{fmtMoney(m.collected)}</td>
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
  const { data: invoices = [], isLoading } = useQuery({ queryKey: ["invoices"], queryFn: invoiceApi.list });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const [status, setStatus] = useState<"all" | InvoiceDisplayStatus>("all");

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";

  const filtered = useMemo(
    () => invoices.filter((inv) => status === "all" || invoiceDisplayStatus(inv) === status),
    [invoices, status]
  );

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
      filtered.map((inv) => [
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
      data={filtered}
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
            <SelectValue />
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
    />
  );
}

type StatementRow = {
  id: string;
  date: string;
  description: string;
  charge: number;
  credit: number;
};

function CustomerStatement() {
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: invoiceApi.list });
  const { data: adjustments = [] } = useQuery({ queryKey: billingKeys.adjustments(), queryFn: adjustmentsApi.list });
  const [customerId, setCustomerId] = useState("");

  const customer = customers.find((c) => c.id === customerId);

  const rows = useMemo<StatementRow[]>(() => {
    if (!customerId) return [];
    const entries: StatementRow[] = [];
    for (const inv of invoices) {
      if (inv.customerId !== customerId || inv.status === "cancelled") continue;
      entries.push({ id: `inv-${inv.id}`, date: inv.issueDate, description: `Invoice ${inv.number}`, charge: inv.total, credit: 0 });
      for (const payment of inv.payments) {
        entries.push({
          id: `pay-${payment.id}`,
          date: payment.date,
          description: `Payment for ${inv.number} (${PAYMENT_METHOD_LABELS[payment.method]})`,
          charge: 0,
          credit: payment.amount,
        });
      }
    }
    for (const adj of adjustments) {
      if (adj.customerId !== customerId || adj.status !== "issued") continue;
      entries.push({
        id: `adj-${adj.id}`,
        date: adj.createdAt,
        description: `${adj.number} (${adj.kind === "credit" ? "Credit" : "Debit"} Note)`,
        charge: adj.kind === "debit" ? adj.amount : 0,
        credit: adj.kind === "credit" ? adj.amount : 0,
      });
    }
    return entries.sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [customerId, invoices, adjustments]);

  const opening = customer?.openingBalance ?? 0;
  const rowsWithBalance = rows.reduce<(StatementRow & { balance: number })[]>((acc, row) => {
    const previous = acc.length > 0 ? acc[acc.length - 1].balance : opening;
    acc.push({ ...row, balance: previous + row.charge - row.credit });
    return acc;
  }, []);
  const closingBalance = rowsWithBalance.length > 0 ? rowsWithBalance[rowsWithBalance.length - 1].balance : opening;

  function exportCsv() {
    if (!customer) return;
    downloadCsv(
      `statement-${customer.customerCode}.csv`,
      ["Date", "Description", "Charge", "Credit", "Balance"],
      [
        ["", "Opening Balance", "", "", opening],
        ...rowsWithBalance.map((r) => [fmtDate(r.date), r.description, r.charge || "", r.credit || "", r.balance]),
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
                <SelectValue placeholder="Select a customer" />
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

      {customer && (
        <>
          <StatTiles
            tiles={[
              { label: "Opening Balance", value: fmtMoney(opening, customer.currency), tone: "neutral" },
              { label: "Closing Balance", value: fmtMoney(closingBalance, customer.currency), tone: closingBalance > 0 ? "amber" : "green" },
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
                    <td className="px-5 py-2.5 text-right font-semibold text-text">{fmtMoney(opening, customer.currency)}</td>
                  </tr>
                  {rowsWithBalance.map((row) => (
                    <tr key={row.id} className="border-t border-border">
                      <td className="px-5 py-2.5 text-text-3">{fmtDate(row.date)}</td>
                      <td className="px-5 py-2.5 text-text-2">{row.description}</td>
                      <td className="px-5 py-2.5 text-right text-text">{row.charge > 0 ? fmtMoney(row.charge, customer.currency) : "—"}</td>
                      <td className="px-5 py-2.5 text-right text-green">{row.credit > 0 ? fmtMoney(row.credit, customer.currency) : "—"}</td>
                      <td className="px-5 py-2.5 text-right font-semibold text-text">{fmtMoney(row.balance, customer.currency)}</td>
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
