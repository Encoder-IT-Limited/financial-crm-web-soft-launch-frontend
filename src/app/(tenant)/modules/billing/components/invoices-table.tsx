"use client";

import type { Column, Table as TanstackTable } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Invoice } from "../types";

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
        align === "right" && "ml-auto",
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

export function InvoicesTable({
  table,
  onRowClick,
}: {
  table: TanstackTable<Invoice>;
  onRowClick: (invoice: Invoice) => void;
}) {
  const rows = table.getRowModel().rows;
  const columnCount = table.getAllLeafColumns().length;

  return (
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
                  header.column.id === "actions" && "w-36 text-right",
                )}
              >
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
            onClick={() => onRowClick(row.original)}
            className="cursor-pointer transition-colors hover:bg-surface-subtle"
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                className={cn(
                  "px-5 py-3",
                  cell.column.id === "select" && "w-10 px-4",
                  ["amount", "paid", "balance"].includes(cell.column.id) && "pr-5 text-right",
                )}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={columnCount} className="h-28 text-center text-[13px] text-text-4">
              No invoices match your filters.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
