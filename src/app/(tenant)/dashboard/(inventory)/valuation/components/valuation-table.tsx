"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type PaginationState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown, Download, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/shared/table-pagination";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProductThumbnail } from "../../products/components/product-thumbnail";
import {
  unitCostAt,
  type ValuationMethod,
  type ValuationRow,
} from "../mock-data";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: "left" | "right";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

const categoryTone: Record<
  ValuationRow["category"],
  "blue" | "purple" | "amber" | "green" | "neutral"
> = {
  Laptops: "blue",
  Accessories: "purple",
  Furniture: "amber",
  Office: "green",
  Services: "neutral",
};

interface ValuationTableProps {
  rows: ValuationRow[];
  method: ValuationMethod;
  onExportSelected?: (rows: ValuationRow[]) => void;
}

export function ValuationTable({ rows, method, onExportSelected }: ValuationTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns = useMemo<AnyColumnDef<ValuationRow>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all valuation lines on this page"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.name} in ${row.original.warehouse}`}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          />
        ),
      },
      {
        accessorKey: "name",
        header: "Product",
        cell: ({ row }) => (
          <span className="flex items-center gap-3">
            <ProductThumbnail product={row.original} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-semibold text-text min-[1440px]:text-[13.5px]">
                {row.original.name}
              </span>
              <span className="text-[11px] tabular-nums text-text-4">{row.original.sku}</span>
            </span>
          </span>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge tone={categoryTone[row.original.category]}>{row.original.category}</Badge>
        ),
      },
      {
        accessorKey: "warehouse",
        header: "Warehouse",
        cell: ({ row }) => (
          <span className="text-[12.5px] text-text-2 min-[1440px]:text-[13px]">
            {row.original.warehouse}
          </span>
        ),
      },
      {
        accessorKey: "qty",
        header: "Qty In Stock",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-[12.5px] font-semibold tabular-nums text-text min-[1440px]:text-[13.5px]">
            {row.original.qty.toLocaleString("en-US")}
          </span>
        ),
      },
      {
        id: "unitCost",
        accessorFn: (line) => unitCostAt(line, method),
        header: "Unit Cost",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-[12.5px] tabular-nums text-text-2 min-[1440px]:text-[13.5px]">
            {fmtMoney(unitCostAt(row.original, method))}
          </span>
        ),
      },
      {
        accessorKey: "unitRetail",
        header: "Unit Retail Price",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-[12.5px] tabular-nums text-text-2 min-[1440px]:text-[13.5px]">
            {fmtMoney(row.original.unitRetail)}
          </span>
        ),
      },
      {
        id: "totalCost",
        accessorFn: (line) => line.qty * unitCostAt(line, method),
        header: "Total Cost Value",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-[12.5px] font-semibold tabular-nums text-text min-[1440px]:text-[13.5px]">
            {fmtMoney(row.getValue<number>("totalCost"))}
          </span>
        ),
      },
      {
        id: "totalRetail",
        accessorFn: (line) => line.qty * line.unitRetail,
        header: "Total Retail Value",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-[12.5px] font-semibold tabular-nums text-text min-[1440px]:text-[13.5px]">
            {fmtMoney(row.getValue<number>("totalRetail"))}
          </span>
        ),
      },
      {
        id: "profitPotential",
        accessorFn: (line) => line.qty * (line.unitRetail - unitCostAt(line, method)),
        header: "Profit Potential",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-[12.5px] font-bold tabular-nums text-green min-[1440px]:text-[13.5px]">
            {fmtMoney(row.getValue<number>("profitPotential"))}
          </span>
        ),
      },
    ],
    [method]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination, rowSelection },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (line) => line.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const tableRows = table.getRowModel().rows;
  const selectedRows = rows.filter((line) => rowSelection[line.id]);
  const selectedCount = selectedRows.length;

  return (
    <div className="flex flex-col gap-4">
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-t bg-blue-l px-3 py-2 text-[12.5px]">
          <span className="font-semibold text-blue">
            {selectedCount} line{selectedCount === 1 ? "" : "s"} selected
          </span>
          <span className="flex items-center gap-1.5">
            {onExportSelected && (
              <Button variant="outline" size="sm" onClick={() => onExportSelected(selectedRows)}>
                <Download data-icon-size />
                Export selected
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>
              <X data-icon-size />
              Clear
            </Button>
          </span>
        </div>
      )}

      <div className="overflow-x-auto overflow-y-hidden rounded-[10px] border border-border">
        <Table className="whitespace-nowrap">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-surface-subtle hover:bg-surface-subtle">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const alignRight = header.column.columnDef.meta?.align === "right";
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-11 px-4 font-semibold text-text-2 first:pl-5 last:pr-5",
                        alignRight && "text-right"
                      )}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            "inline-flex items-center gap-1 transition-colors hover:text-text",
                            alignRight && "w-full justify-end"
                          )}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === "asc" ? (
                            <ChevronUp className="size-3.5 text-blue" />
                          ) : sorted === "desc" ? (
                            <ChevronDown className="size-3.5 text-blue" />
                          ) : (
                            <ChevronsUpDown className="size-3.5 text-text-4" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {tableRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-28 text-center text-[13px] text-text-4"
                >
                  No valuation lines match the current search or filters.
                </TableCell>
              </TableRow>
            ) : (
              tableRows.map((row) => (
                <TableRow key={row.id} data-selected={row.getIsSelected()}>
                  {row.getVisibleCells().map((cell) => {
                    const alignRight = cell.column.columnDef.meta?.align === "right";
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn("px-4 py-3 first:pl-5 last:pr-5", alignRight && "text-right")}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
    </div>
  );
}
