"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type Column,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, BellRing, Download, Eye, FileText, Plus, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeading } from "@/components/shared/page-heading";
import { toast } from "@/lib/toast";
import { downloadCsv } from "@/lib/csv";
import { fmtDate, fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  invoiceBalance,
  invoiceDisplayStatus,
  isInvoiceOverdue,
  type Invoice,
  type InvoiceDisplayStatus,
} from "../../modules/billing/types";
import { invoiceApi } from "../../modules/billing/api/invoices.service";
import { customersApi } from "../../modules/crm/api/customers.service";
import { InvoiceStatusBadge } from "../../modules/billing/components/invoice-status-badge";
import { StatTiles } from "../../modules/billing/components/stat-tiles";
import { InvoicePreviewDialog } from "../../modules/billing/components/invoice-preview-dialog";
import { RecurringTemplatesPanel } from "../../modules/billing/components/recurring-templates-panel";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

type Filters = {
  search: string;
  status: "all" | InvoiceDisplayStatus;
  customer: string;
};

export default function InvoicesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: invoiceApi.list });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const [filters, setFilters] = useState<Filters>({ search: "", status: "all", customer: "all" });
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sendingReminders, setSendingReminders] = useState(false);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (filters.status !== "all" && invoiceDisplayStatus(inv) !== filters.status) return false;
      if (filters.customer !== "all" && inv.customerId !== filters.customer) return false;
      if (needle) {
        const haystack = `${inv.number} ${customerName(inv.customerId)} ${inv.notes ?? ""}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, invoices, customers]);

  const columns = useMemo<AnyColumnDef<Invoice>[]>(
    () => [
      {
        id: "select",
        size: 40,
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all invoices"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Select ${row.original.number}`}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      },
      {
        accessorKey: "number",
        header: ({ column }) => <SortableHeader column={column} label="Invoice #" />,
        cell: ({ row }) => (
          <Link href={`/dashboard/invoices/${row.original.id}`} className="font-bold text-blue hover:underline">
            {row.original.number}
          </Link>
        ),
      },
      {
        id: "customer",
        accessorFn: (inv) => customerName(inv.customerId),
        header: "Customer",
        cell: ({ row }) => <span className="text-[13px] text-text">{customerName(row.original.customerId)}</span>,
      },
      {
        id: "issueDate",
        accessorFn: (inv) => inv.issueDate,
        header: ({ column }) => <SortableHeader column={column} label="Issue Date" />,
        cell: ({ row }) => <span className="text-[12.5px] text-text-2">{fmtDate(row.original.issueDate)}</span>,
      },
      {
        id: "dueDate",
        accessorFn: (inv) => inv.dueDate,
        header: ({ column }) => <SortableHeader column={column} label="Due Date" />,
        cell: ({ row }) => <span className="text-[12.5px] text-text-2">{fmtDate(row.original.dueDate)}</span>,
      },
      {
        id: "amount",
        accessorFn: (inv) => inv.total,
        header: ({ column }) => <SortableHeader column={column} label="Amount" align="right" />,
        cell: ({ row }) => (
          <span className="text-right text-[13px] font-semibold text-text">{fmtMoney(row.original.total, row.original.currency)}</span>
        ),
      },
      {
        id: "paid",
        accessorFn: (inv) => inv.paidAmount,
        header: ({ column }) => <SortableHeader column={column} label="Paid" align="right" />,
        cell: ({ row }) => (
          <span className="text-right text-[13px] font-semibold text-green">{fmtMoney(row.original.paidAmount, row.original.currency)}</span>
        ),
      },
      {
        id: "balance",
        accessorFn: (inv) => invoiceBalance(inv),
        header: ({ column }) => <SortableHeader column={column} label="Balance" align="right" />,
        cell: ({ row }) => {
          const balance = invoiceBalance(row.original);
          return (
            <span className={cn("text-right text-[13px] font-semibold", balance > 0 ? "text-amber" : "text-text-3")}>
              {fmtMoney(balance)}
            </span>
          );
        },
      },
      {
        id: "status",
        accessorFn: (inv) => invoiceDisplayStatus(inv),
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => <InvoiceStatusBadge status={invoiceDisplayStatus(row.original)} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Preview ${row.original.number}`}
              onClick={(e) => {
                e.stopPropagation();
                setPreviewId(row.original.id);
              }}
            >
              <Eye />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Download ${row.original.number}`}
              onClick={(e) => {
                e.stopPropagation();
                toast.success(`PDF downloaded — ${row.original.number}.pdf`);
              }}
            >
              <Download />
            </Button>
            <Link
              href={`/dashboard/invoices/${row.original.id}`}
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
              aria-label={`Open ${row.original.number}`}
            >
              <FileText />
            </Link>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customers]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getRowId: (inv) => inv.id,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const stats = useMemo(() => {
    const live = invoices.filter((inv) => inv.status !== "cancelled");
    const outstanding = live.reduce((sum, inv) => sum + invoiceBalance(inv), 0);
    const overdue = invoices.filter(isInvoiceOverdue).reduce((sum, inv) => sum + invoiceBalance(inv), 0);
    const drafts = invoices.filter((inv) => inv.status === "draft").length;
    const paidThisMonth = invoices
      .filter((inv) => inv.status === "paid" && inv.paidAmount > 0)
      .reduce((sum, inv) => sum + inv.paidAmount, 0);
    return { outstanding, overdue, drafts, paidThisMonth };
  }, [invoices]);

  const previewInvoice = previewId ? invoices.find((inv) => inv.id === previewId) ?? null : null;

  const selected = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
  const selectedEligibleForReminder = selected.filter(
    (inv) => inv.status === "sent" || inv.status === "partially-paid"
  );

  function exportCsv(rows: Invoice[]) {
    downloadCsv(
      "invoices.csv",
      ["Invoice #", "Customer", "Issue Date", "Due Date", "Amount", "Paid", "Balance", "Status"],
      rows.map((inv) => [
        inv.number,
        customerName(inv.customerId),
        fmtDate(inv.issueDate),
        fmtDate(inv.dueDate),
        inv.total,
        inv.paidAmount,
        invoiceBalance(inv),
        invoiceDisplayStatus(inv),
      ])
    );
    toast.success(`${rows.length} invoice${rows.length === 1 ? "" : "s"} exported to CSV`);
  }

  async function sendRemindersToSelected() {
    if (selectedEligibleForReminder.length === 0) {
      toast.info("None of the selected invoices are sent or partially paid");
      return;
    }
    setSendingReminders(true);
    try {
      await Promise.all(selectedEligibleForReminder.map((inv) => invoiceApi.sendReminder(inv.id)));
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(`Reminder sent for ${selectedEligibleForReminder.length} invoice(s)`);
      setRowSelection({});
    } finally {
      setSendingReminders(false);
    }
  }

  const rows = table.getRowModel().rows;

  return (
    <div>
      <PageHeading
        title="Invoices"
        subtitle="Create, send and track invoices with QR code & PDF"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => exportCsv(filtered)}>
              <Download /> Excel
            </Button>
            <Link href="/dashboard/invoices/new">
              <Button size="sm">
                <Plus /> New Invoice
              </Button>
            </Link>
          </>
        }
      />

      <Tabs defaultValue="invoices" className="mt-4">
        <TabsList variant="line">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          <StatTiles
            tiles={[
              { label: "Outstanding", value: fmtMoney(stats.outstanding), tone: "amber" },
              { label: "Overdue", value: fmtMoney(stats.overdue), tone: "red", sub: "past due date" },
              { label: "Collected", value: fmtMoney(stats.paidThisMonth), tone: "green", sub: "all-time paid" },
              { label: "Drafts", value: String(stats.drafts), tone: "neutral", sub: "not yet sent" },
            ]}
          />

          <Card className="mt-4 gap-0 p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-4" />
            <Input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search invoices..."
              className="w-full pl-8 sm:w-60"
            />
          </div>
          <Select
            value={filters.status}
            onValueChange={(status) => setFilters({ ...filters, status: (status ?? "all") as Filters["status"] })}
          >
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
          <Select
            value={filters.customer}
            onValueChange={(customer) => setFilters({ ...filters, customer: customer ?? "all" })}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All customers</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto text-[11.5px] text-text-4">
            {filtered.length} of {invoices.length} invoices
          </div>
        </div>

        {selected.length > 0 && (
          <div className="hidden items-center gap-2 border-b border-blue-t bg-blue-l px-3 py-2 lg:flex">
            <BellRing className="size-4 text-blue" />
            <span className="text-[12px] font-semibold text-blue">
              {selected.length} invoice{selected.length === 1 ? "" : "s"} selected
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="xs" onClick={() => exportCsv(selected)}>
                <Download /> Export selected
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={sendingReminders || selectedEligibleForReminder.length === 0}
                onClick={sendRemindersToSelected}
              >
                <BellRing /> Send reminder
              </Button>
              <Button variant="ghost" size="xs" onClick={() => setRowSelection({})}>
                Clear selection
              </Button>
            </div>
          </div>
        )}

        {/* Desktop table */}
        <Table className="hidden lg:table">
          <TableHeader className="bg-surface-subtle">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-surface-subtle">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={header.column.columnDef.size !== undefined ? { width: header.column.getSize() } : undefined}
                    className={cn(
                      "px-5 py-2.5 text-[10.5px] font-bold uppercase tracking-wide text-text-3",
                      header.column.id === "select" && "w-10 px-4",
                      header.column.id === "actions" && "w-36 text-right"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
                onClick={() => router.push(`/dashboard/invoices/${row.original.id}`)}
                className="cursor-pointer transition-colors hover:bg-surface-subtle"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "px-5 py-3",
                      cell.column.id === "select" && "w-10 px-4",
                      ["amount", "paid", "balance"].includes(cell.column.id) && "pr-5 text-right"
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-28 text-center text-[13px] text-text-4">
                  No invoices match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Mobile stacked cards */}
        <div className="flex flex-col divide-y divide-border lg:hidden">
          {filtered.map((inv) => (
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
                    <span
                      className={cn(
                        "font-semibold",
                        invoiceBalance(inv) > 0 ? "text-amber" : "text-green"
                      )}
                    >
                      {fmtMoney(invoiceBalance(inv))}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-[13px] text-text-4">No invoices match your filters.</div>
          )}
        </div>
      </Card>
        </TabsContent>

        <TabsContent value="recurring" className="mt-4">
          <RecurringTemplatesPanel />
        </TabsContent>
      </Tabs>

      <InvoicePreviewDialog
        invoice={previewInvoice}
        open={previewId !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewId(null);
        }}
      />
    </div>
  );
}

function SortableHeader<TData>({
  column,
  label,
  align = "left",
}: {
  column: Column<TData, unknown>;
  label: string;
  align?: "left" | "right";
}) {
  const sorted = column.getIsSorted();
  return (
    <button
      onClick={column.getToggleSortingHandler()}
      className={cn(
        "flex items-center gap-1.5 rounded outline-none hover:text-text focus-visible:ring-2 focus-visible:ring-ring/50",
        align === "right" && "ml-auto"
      )}
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="size-3 text-blue" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3 text-blue" />
      ) : (
        <ArrowUpDown className="size-3 opacity-40" />
      )}
    </button>
  );
}