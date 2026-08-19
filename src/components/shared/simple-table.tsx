"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

export type SimpleTableProps<TData> = {
  columns: AnyColumnDef<TData>[];
  data: TData[];
  toolbar?: ReactNode;
  footer?: (table: TanstackTable<TData>) => ReactNode;
  loading?: boolean;
  skeletonRowCount?: number;
  emptyState?: ReactNode;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (rows: TData[]) => void;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  manualSorting?: boolean;
  manualPagination?: boolean;
  pageCount?: number;
  onSortingChange?: (sorting: SortingState) => void;
  onPaginationChange?: (state: PaginationState) => void;
  initialPageSize?: number;
  /** Skip the wrapping Card — use when embedding inside a tab panel or another card */
  bare?: boolean;
  className?: string;
  rowClassName?: string | ((row: TData) => string);
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData, index: number) => string;
};

function selectionColumn<TData>(): AnyColumnDef<TData> {
  return {
    id: "select",
    size: 40,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
  };
}

export function SimpleTable<TData>({
  columns: userColumns,
  data,
  toolbar,
  footer,
  loading = false,
  skeletonRowCount = 5,
  emptyState,
  enableRowSelection = false,
  onRowSelectionChange,
  globalFilter,
  onGlobalFilterChange,
  manualSorting = false,
  manualPagination = false,
  pageCount,
  onSortingChange,
  onPaginationChange,
  initialPageSize = 10,
  bare = false,
  className,
  rowClassName,
  onRowClick,
  getRowId,
}: SimpleTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const columns = useMemo(
    () => (enableRowSelection ? [selectionColumn<TData>(), ...userColumns] : userColumns),
    [enableRowSelection, userColumns]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
      pagination,
      ...(globalFilter !== undefined ? { globalFilter } : {}),
    },
    getRowId,
    manualSorting,
    manualPagination,
    pageCount: manualPagination ? pageCount : undefined,
    onSortingChange: (updater) => {
      setSorting((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        onSortingChange?.(next);
        return next;
      });
    },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      setPagination((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        onPaginationChange?.(next);
        return next;
      });
    },
    onGlobalFilterChange,
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  useEffect(() => {
    if (!onRowSelectionChange) return;
    onRowSelectionChange(table.getFilteredSelectedRowModel().rows.map((row) => row.original));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  const rows = table.getRowModel().rows;
  const isEmpty = !loading && rows.length === 0;

  const content = (
    <>
      {toolbar}

      <Table>
        <TableHeader className="bg-surface-subtle">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-surface-subtle">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={
                    header.column.columnDef.size !== undefined
                      ? { width: header.column.getSize() }
                      : undefined
                  }
                  className="h-11 text-text-2"
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
          {loading &&
            Array.from({ length: skeletonRowCount }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-4 w-full max-w-32" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {!loading &&
            rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
                onClick={() => onRowClick?.(row.original)}
                className={cn(
                  onRowClick && "cursor-pointer",
                  typeof rowClassName === "function" ? rowClassName(row.original) : rowClassName
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {isEmpty && (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-28 text-center text-[13px] text-text-4">
                {emptyState ?? "No results found."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {footer?.(table)}
    </>
  );

  if (bare) {
    return <div className={cn("flex flex-col", className)}>{content}</div>;
  }

  return (
    <Card className={cn("gap-0 overflow-hidden p-0", className)}>{content}</Card>
  );
}
