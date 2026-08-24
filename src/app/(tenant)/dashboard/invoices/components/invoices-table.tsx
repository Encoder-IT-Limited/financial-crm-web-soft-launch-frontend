"use client";

import { useRouter } from "next/navigation";
import type { Table as TanstackTable } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Invoice } from "../types";

/** Desktop invoice table — extracted verbatim from the list page; behavior
 * unchanged (row click navigates, columns/sorting come from the shared
 * `table` instance owned by the parent). */
export function InvoicesTable({ table, columnCount }: { table: TanstackTable<Invoice>; columnCount: number }) {
  const router = useRouter();
  const rows = table.getRowModel().rows;

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
                  header.column.id === "actions" && "w-36 text-right"
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
            <TableCell colSpan={columnCount} className="h-28 text-center text-[13px] text-text-4">
              No invoices match your filters.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
