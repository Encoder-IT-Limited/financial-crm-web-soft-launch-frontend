"use client";

import { type ReactNode, useState } from "react";
import {
  type Column,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
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
import { TablePagination } from "./table-pagination";
import { TableToolbar } from "./table-toolbar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

function getColumnLabel<TData>(column: Column<TData, unknown>): string {
  const meta = column.columnDef.meta as { label?: string } | undefined;
  if (meta?.label) return meta.label;

  const header = column.columnDef.header;
  if (typeof header === "string") return header;

  return column.id
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
}

export type FilterableTableProps<TData> = {
  // Title row, rendered above the card
  title?: string;
  titleIcon?: ReactNode;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;

  // Toolbar
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  filters?: ReactNode;
  onClearFilters?: () => void;

  // Table
  columns: AnyColumnDef<TData>[];
  data: TData[];
  loading?: boolean;
  skeletonRowCount?: number;
  error?: ReactNode;
  emptyState?: ReactNode;

  // Sorting / pagination (API-ready — pass manual* + a handler for server-driven data)
  manualSorting?: boolean;
  onSortingChange?: (sorting: SortingState) => void;
  manualPagination?: boolean;
  pageCount?: number;
  totalCount?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  onPaginationChange?: (state: PaginationState) => void;

  // Row interaction
  onRowClick?: (row: TData) => void;
  rowClassName?: string | ((row: TData) => string);
  getRowId?: (row: TData, index: number) => string;

  className?: string;
  cardClassName?: string;
};

export function FilterableTable<TData>({
  title,
  titleIcon,
  subtitle,
  badge,
  actions,
  search,
  filters,
  onClearFilters,
  columns,
  data,
  loading = false,
  skeletonRowCount = 5,
  error,
  emptyState,
  manualSorting = false,
  onSortingChange,
  manualPagination = false,
  pageCount,
  totalCount,
  initialPageSize = 10,
  pageSizeOptions,
  onPaginationChange,
  onRowClick,
  rowClassName,
  getRowId,
  className,
  cardClassName,
}: FilterableTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination, columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
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
    onPaginationChange: (updater) => {
      setPagination((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        onPaginationChange?.(next);
        return next;
      });
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;
  const isEmpty = !loading && !error && rows.length === 0;

  const columnOptions = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide())
    .map((column) => ({
      id: column.id,
      label: getColumnLabel(column),
      visible: column.getIsVisible(),
    }));

  const showToolbar = Boolean(
    search || filters || onClearFilters || columnOptions.length > 0,
  );

  return (
    <div className={cn("flex flex-col gap-4 ", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {titleIcon}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                {title && (
                  <h3 className="text-[15px] font-bold text-text">{title}</h3>
                )}
                {badge}
              </div>
              {subtitle && (
                <p className="text-[11px] text-text-4">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-2.5">{actions}</div>
          )}
        </div>
      )}

      <Card className={cn("flex flex-col gap-4 p-3", cardClassName)}>
        {showToolbar && (
          <TableToolbar
            search={search}
            onClearFilters={onClearFilters}
            columnOptions={columnOptions}
            onToggleColumn={(id, visible) =>
              table.getColumn(id)?.toggleVisibility(visible)
            }
          >
            {filters}
          </TableToolbar>
        )}

        <div className="overflow-x-auto overflow-y-hidden rounded-[10px] border border-border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-surface-subtle hover:bg-surface-subtle"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={
                        header.column.columnDef.size !== undefined
                          ? { width: header.column.getSize() }
                          : undefined
                      }
                      className="h-11 px-5 font-semibold text-text-2"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
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
                      <TableCell key={colIndex} className="px-5 py-[18px]">
                        <Skeleton className="h-4 w-full max-w-32" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading && error && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-28 text-center text-[13px] text-red"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                !error &&
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      onRowClick && "cursor-pointer",
                      typeof rowClassName === "function"
                        ? rowClassName(row.original)
                        : rowClassName,
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-5 py-[18px]">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {isEmpty && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-28 text-center text-[13px] text-text-4"
                  >
                    {emptyState ?? "No results found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          table={table}
          totalCount={totalCount}
          pageSizeOptions={pageSizeOptions}
        />
      </Card>
    </div>
  );
}
