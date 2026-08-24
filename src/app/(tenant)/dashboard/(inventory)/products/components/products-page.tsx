"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Download,
  Eye,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeading } from "@/components/shared/page-heading";
import { TablePagination } from "@/components/shared/table-pagination";
import { fmtMoney } from "@/lib/format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  products as initialProducts,
  type Product,
  type ProductCategory,
  type ProductStatus,
} from "../mock-data";
import {
  ProductsToolbar,
  type SortPreset,
} from "./products-toolbar";
import { ProductsEmptyState } from "./products-empty-state";
import { ProductThumbnail, getStockTone } from "./product-thumbnail";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

type Filters = {
  search: string;
  category: ProductCategory | "all";
  status: ProductStatus | "all";
};

const SORT_PRESETS: Record<SortPreset, SortingState> = {
  featured: [],
  "name-asc": [{ id: "name", desc: false }],
  "stock-asc": [{ id: "stock", desc: false }],
  "stock-desc": [{ id: "stock", desc: true }],
  "price-asc": [{ id: "price", desc: false }],
  "price-desc": [{ id: "price", desc: true }],
};

function presetFromSorting(sorting: SortingState): SortPreset {
  const entry = Object.entries(SORT_PRESETS).find(
    ([, preset]) =>
      preset.length === sorting.length &&
      preset.every((col, i) => col.id === sorting[i].id && col.desc === sorting[i].desc)
  );
  return (entry?.[0] as SortPreset) ?? "featured";
}

const categoryTone: Record<ProductCategory, "blue" | "purple" | "amber" | "green" | "neutral"> = {
  Laptops: "blue",
  Accessories: "purple",
  Furniture: "amber",
  Office: "green",
  Services: "neutral",
};

function exportProductsCsv(rows: Product[]) {
  const header = ["Product", "SKU", "Category", "Stock", "Price (AED)", "Status"];
  const body = rows.map((p) => [p.name, p.sku, p.category, p.stock, p.price, p.status]);
  const csv = [header, ...body]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `products_${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ProductsPage() {
  const [items, setItems] = useState<Product[]>(initialProducts);
  const [filters, setFilters] = useState<Filters>({ search: "", category: "all", status: "all" });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return items.filter((p) => {
      if (filters.category !== "all" && p.category !== filters.category) return false;
      if (filters.status !== "all" && p.status !== filters.status) return false;
      if (needle) {
        const haystack = `${p.name} ${p.sku} ${p.category}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [items, filters]);

  function clearFilters() {
    setFilters({ search: "", category: "all", status: "all" });
    setSorting([]);
  }

  function handleSortChange(preset: SortPreset) {
    setSorting(SORT_PRESETS[preset]);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setItems((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setRowSelection((prev) => {
      const next = { ...prev };
      delete next[deleteTarget.id];
      return next;
    });
  }

  const columns = useMemo<AnyColumnDef<Product>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all products on this page"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.name}`}
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
        cell: ({ row }) => <Badge tone={categoryTone[row.original.category]}>{row.original.category}</Badge>,
      },
      {
        accessorKey: "warehouse",
        header: "Warehouse",
        cell: ({ row }) => (
          <span className="text-[12.5px] text-text-2 min-[1440px]:text-[13.5px]">
            {row.original.warehouse}
          </span>
        ),
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => {
          const tone = getStockTone(row.original.stock);
          return (
            <span className={cn("flex items-center justify-start gap-1.5 text-[12.5px] font-semibold tabular-nums min-[1440px]:text-[13.5px]")}>
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  tone === "green" && "bg-green",
                  tone === "amber" && "bg-amber",
                  tone === "red" && "bg-red"
                )}
                aria-hidden
              />
              <span className={cn(tone === "green" && "text-green", tone === "amber" && "text-amber", tone === "red" && "text-red")}>
                {row.original.stock}
              </span>
            </span>
          );
        },
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => (
          <span className="text-[12.5px] font-semibold tabular-nums text-text min-[1440px]:text-[13.5px]">
            {fmtMoney(row.original.price)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge tone={row.original.status === "active" ? "green" : "neutral"}>
            {row.original.status === "active" ? "Active" : "Inactive"}
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
              aria-label={`View ${row.original.name}`}
              render={<Link href={`/dashboard/products/${row.original.id}`} />}
              nativeButton={false}
            >
              <Eye />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${row.original.name}`}
              onClick={() =>
                toast.info("Editing will be available once the inventory API is connected")
              }
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${row.original.name}`}
              className="text-red hover:text-red"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 />
            </Button>
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, pagination, rowSelection },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (p) => p.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;
  const selectedCount = Object.keys(rowSelection).length;

  function handleExport() {
    exportProductsCsv(filtered);
    toast.success("Products exported", {
      description: `${filtered.length} product${filtered.length === 1 ? "" : "s"} downloaded as CSV.`,
    });
  }

  return (
    <div>
      <PageHeading
        title="Products"
        subtitle="Manage your products catalog"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download data-icon="inline-start" />
              Export
            </Button>
            <Button render={<Link href="/dashboard/products/new" />} nativeButton={false}>
              <Plus data-icon="inline-start" />
              Add Product
            </Button>
          </>
        }
      />

      <Card className="flex flex-col gap-4 p-5">
        <ProductsToolbar
          search={filters.search}
          onSearchChange={(search) => setFilters({ ...filters, search })}
          category={filters.category}
          onCategoryChange={(category) => setFilters({ ...filters, category })}
          status={filters.status}
          onStatusChange={(status) => setFilters({ ...filters, status })}
          sort={presetFromSorting(sorting)}
          onSortChange={handleSortChange}
          selectedCount={selectedCount}
          onClearSelection={() => setRowSelection({})}
        />

        {filtered.length === 0 ? (
          <ProductsEmptyState
            hasFilters={Boolean(filters.search) || filters.category !== "all" || filters.status !== "all"}
            onClearFilters={clearFilters}
          />
        ) : (
          <>
            <div className="overflow-x-auto overflow-y-hidden rounded-[10px] border border-border">
              <Table className="whitespace-nowrap">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="bg-surface-subtle hover:bg-surface-subtle">
                      {headerGroup.headers.map((header) => {
                        const canSort = header.column.getCanSort();
                        const sorted = header.column.getIsSorted();
                        return (
                          <TableHead key={header.id} className="h-11 px-4 font-semibold text-text-2 first:pl-5 last:pr-5">
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
                  {rows.map((row) => (
                    <TableRow key={row.id} data-selected={row.getIsSelected()}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-4 py-3 first:pl-5 last:pr-5">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete product"
        description={`This will permanently remove "${deleteTarget?.name ?? ""}" (${deleteTarget?.sku ?? ""}) from your catalog.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        successMessage={`${deleteTarget?.name ?? "Product"} deleted`}
      />
    </div>
  );
}
