"use client";

import type { Table as TanstackTable } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type TablePaginationProps<TData> = {
  table: TanstackTable<TData>;
  totalCount?: number;
  pageSizeOptions?: number[];
  className?: string;
};

function getPageNumbers(current: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, pageCount, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);

  const result: (number | "…")[] = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) result.push("…");
    result.push(page);
  });
  return result;
}

export function TablePagination<TData>({
  table,
  totalCount,
  pageSizeOptions = [10, 25, 50],
  className,
}: TablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const rowCount = totalCount ?? table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const from = rowCount === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, rowCount);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 px-1 py-2.5 text-[12.5px]",
        className
      )}
    >
      <p className="order-1 text-text-3">
        Showing {from} to {to} of {rowCount} entries
      </p>

      <div className="order-3 flex items-center gap-1 md:order-2">
        <button
          type="button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="flex h-7 items-center gap-0.5 rounded-md px-2 font-medium text-text-2 transition-colors hover:bg-surface-subtle disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="size-3.5" />
          Prev
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers(pageIndex + 1, pageCount).map((page, i) =>
            page === "…" ? (
              <span key={`ellipsis-${i}`} className="px-1 text-text-4">
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => table.setPageIndex(page - 1)}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md text-center font-medium transition-colors",
                  page === pageIndex + 1
                    ? "bg-blue-l text-blue"
                    : "text-text-2 hover:bg-surface-subtle"
                )}
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="flex h-7 items-center gap-0.5 rounded-md px-2 font-medium text-text-2 transition-colors hover:bg-surface-subtle disabled:pointer-events-none disabled:opacity-40"
        >
          Next
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      <div className="order-2 md:order-3">
        <Select value={String(pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}>
          <SelectTrigger className="h-8 border-border text-[12.5px]">
            <SelectValue />
            <span className="text-text-4">/ page</span>
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
