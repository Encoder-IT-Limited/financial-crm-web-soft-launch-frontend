"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Eye, FileText } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/lib/toast";
import { fmtDate, fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { invoiceBalance, invoiceDisplayStatus, type Invoice } from "../types";
import type { Customer } from "../../../modules/crm/types";
import { InvoiceStatusBadge } from "./invoice-status-badge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

export function SortableHeader<TData>({
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

/** Column definitions for the Invoices desktop/table view — extracted verbatim
 * from the list page so it stays readable; behavior is unchanged. */
export function useInvoiceColumns({
  customers,
  onPreview,
}: {
  customers: Customer[];
  onPreview: (invoiceId: string) => void;
}): AnyColumnDef<Invoice>[] {
  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";

  return useMemo<AnyColumnDef<Invoice>[]>(
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
                onPreview(row.original.id);
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
}
