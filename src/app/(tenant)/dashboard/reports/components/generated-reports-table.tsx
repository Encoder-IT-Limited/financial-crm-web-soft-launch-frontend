"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown, Download, Share2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/shared/table-pagination";
import { fmtDateTime } from "@/lib/format";
import { toast } from "@/lib/toast";
import {
  REPORT_FORMAT_LABEL,
  REPORT_FORMAT_TONE,
  REPORT_STATUS_LABEL,
  REPORT_STATUS_TONE,
  reportCategoryTone,
  reportSizeBytes,
  type GeneratedReport,
} from "../mock-data";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

interface GeneratedReportsTableProps {
  rows: GeneratedReport[];
  onDelete: (report: GeneratedReport) => void;
}

export function GeneratedReportsTable({ rows, onDelete }: GeneratedReportsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "generatedAt", desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const columns = useMemo<AnyColumnDef<GeneratedReport>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Report Name",
        cell: ({ row }) => (
          <span className="max-w-[280px] truncate text-[13px] font-semibold text-text min-[1440px]:text-[13.5px]">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge tone={reportCategoryTone(row.original.category)}>{row.original.category}</Badge>
        ),
      },
      {
        id: "generatedAt",
        accessorFn: (report) => new Date(report.generatedAt).getTime(),
        header: "Generated At",
        cell: ({ row }) => (
          <span className="text-[12.5px] tabular-nums text-text-2 min-[1440px]:text-[13px]">
            {fmtDateTime(row.original.generatedAt)}
          </span>
        ),
      },
      {
        accessorKey: "format",
        enableSorting: false,
        header: "Format",
        cell: ({ row }) => (
          <Badge tone={REPORT_FORMAT_TONE[row.original.format]}>
            {REPORT_FORMAT_LABEL[row.original.format]}
          </Badge>
        ),
      },
      {
        id: "fileSize",
        accessorFn: (report) => reportSizeBytes(report.fileSize),
        header: "File Size",
        cell: ({ row }) => (
          <span className="text-[12.5px] tabular-nums text-text-2 min-[1440px]:text-[13px]">
            {row.original.fileSize}
          </span>
        ),
      },
      {
        accessorKey: "status",
        enableSorting: false,
        header: "Status",
        cell: ({ row }) => (
          <Badge tone={REPORT_STATUS_TONE[row.original.status]}>
            {REPORT_STATUS_LABEL[row.original.status]}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex items-center justify-end gap-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Download ${row.original.name}`}
              disabled={row.original.status !== "ready"}
              onClick={() =>
                toast.info("Downloads will be available once the reports service is connected")
              }
            >
              <Download />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Share ${row.original.name}`}
              onClick={() =>
                toast.info("Sharing will be available once the reports service is connected")
              }
            >
              <Share2 />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${row.original.name}`}
              className="text-red hover:text-red"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 />
            </Button>
          </span>
        ),
      },
    ],
    [onDelete]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const tableRows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto overflow-y-hidden rounded-[10px] border border-border">
        <Table className="whitespace-nowrap">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-surface-subtle hover:bg-surface-subtle">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      className="h-11 px-4 font-semibold text-text-2 first:pl-5 last:pr-5"
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 transition-colors hover:text-text"
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
                  No reports match the current search or filters.
                </TableCell>
              </TableRow>
            ) : (
              tableRows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 first:pl-5 last:pr-5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
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
