"use client";

import { useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/shared/page-heading";
import { toast } from "@/lib/toast";
import { PRODUCT_CATEGORIES } from "../../products/mock-data";
import {
  REORDER_WAREHOUSES,
  getUnitPrice,
  getItemLevel,
  lowStockItems as lowStockSeed,
  nextReorderId,
  purchaseReorders as reordersSeed,
  suggestedReorderQty,
  type LowStockItem,
  type PurchaseReorder,
  type ReorderSaveData,
} from "../mock-data";
import { CreateReorderDialog, defaultDeliveryDate } from "./create-reorder-dialog";
import { LowStockTable } from "./low-stock-table";
import { PendingReordersTable } from "./pending-reorders-table";
import { ReorderSummaryCards } from "./reorder-summary-cards";
import { ReorderToolbar, type ReorderFilters } from "./reorder-toolbar";

const INITIAL_FILTERS: ReorderFilters = {
  search: "",
  warehouse: "all",
  category: "all",
  level: "all",
  supplier: "all",
};

function exportLowStockCsv(rows: LowStockItem[]) {
  const header = [
    "Product",
    "SKU",
    "Warehouse",
    "Current Qty",
    "Min Stock",
    "Reorder Point",
    "Suggested Reorder Qty",
    "Supplier",
    "Last Restocked",
    "Level",
  ];
  const body = rows.map((item) => [
    item.productName,
    item.sku,
    item.warehouse,
    String(item.currentQty),
    String(item.minStock),
    String(item.reorderPoint),
    String(suggestedReorderQty(item)),
    item.supplier,
    item.lastRestocked,
    getItemLevel(item) === "critical" ? "Critical" : "Low",
  ]);
  const csv = [header, ...body]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `low_stock_items_${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ReorderPage() {
  const [filters, setFilters] = useState<ReorderFilters>(INITIAL_FILTERS);
  const [reorders, setReorders] = useState<PurchaseReorder[]>(reordersSeed);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quickItem, setQuickItem] = useState<LowStockItem | null>(null);
  const [editTarget, setEditTarget] = useState<PurchaseReorder | null>(null);
  const [defaultDelivery, setDefaultDelivery] = useState("");

  const suppliers = useMemo(
    () =>
      [...new Set([...lowStockSeed.map((i) => i.supplier), ...reorders.map((r) => r.supplier)])].sort(),
    [reorders]
  );

  const summary = useMemo(() => {
    return {
      criticalItems: lowStockSeed.filter((i) => getItemLevel(i) === "critical").length,
      lowStockItems: lowStockSeed.filter((i) => getItemLevel(i) === "low").length,
      reordersPending: reorders.filter(
        (r) => r.status === "pending-approval" || r.status === "ordered"
      ).length,
      totalReorderValue: reorders
        .filter((r) => r.status !== "received")
        .reduce((sum, r) => sum + r.requestedQty * getUnitPrice(r.sku), 0),
    };
  }, [reorders]);

  const needle = filters.search.trim().toLowerCase();

  const filteredAlerts = useMemo(() => {
    return lowStockSeed.filter((item) => {
      if (filters.warehouse !== "all" && item.warehouse !== filters.warehouse) return false;
      if (filters.category !== "all" && item.category !== filters.category) return false;
      if (filters.level !== "all" && getItemLevel(item) !== filters.level) return false;
      if (filters.supplier !== "all" && item.supplier !== filters.supplier) return false;
      if (needle) {
        const haystack = `${item.productName} ${item.sku} ${item.supplier}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [filters, needle]);

  const filteredReorders = useMemo(() => {
    return reorders.filter((r) => {
      if (filters.supplier !== "all" && r.supplier !== filters.supplier) return false;
      if (needle) {
        const haystack = `${r.productName} ${r.sku} ${r.supplier} ${r.id}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [reorders, filters, needle]);

  function openCreateDialog() {
    setQuickItem(null);
    setEditTarget(null);
    setDefaultDelivery(defaultDeliveryDate());
    setDialogOpen(true);
  }

  function openQuickReorder(item: LowStockItem) {
    setQuickItem(item);
    setEditTarget(null);
    setDefaultDelivery(defaultDeliveryDate());
    setDialogOpen(true);
  }

  function openEditReorder(reorder: PurchaseReorder) {
    setQuickItem(null);
    setEditTarget(reorder);
    setDialogOpen(true);
  }

  function handleSave(data: ReorderSaveData) {
    if (editTarget) {
      setReorders((prev) =>
        prev.map((r) =>
          r.id === editTarget.id
            ? {
                ...r,
                requestedQty: data.requestedQty,
                expectedDelivery: data.expectedDelivery,
                notes: data.notes,
              }
            : r
        )
      );
      toast.success("Reorder updated", {
        description: `${editTarget.id} — ${data.requestedQty} × ${editTarget.productName}.`,
      });
    } else {
      const item = lowStockSeed.find((i) => i.sku === data.sku);
      if (!item) return;
      const created: PurchaseReorder = {
        id: nextReorderId(reorders),
        sku: item.sku,
        productName: item.productName,
        category: item.category,
        supplier: item.supplier,
        requestedQty: data.requestedQty,
        status: "pending-approval",
        expectedDelivery: data.expectedDelivery,
        notes: data.notes,
      };
      setReorders((prev) => [created, ...prev]);
      toast.success("Reorder created", {
        description: `${created.id} — ${data.requestedQty} × ${item.productName} from ${item.supplier}.`,
      });
    }
    setDialogOpen(false);
    setQuickItem(null);
    setEditTarget(null);
  }

  function handleApprove(list: PurchaseReorder[]) {
    if (list.length === 0) return;
    const ids = new Set(list.map((r) => r.id));
    setReorders((prev) =>
      prev.map((r) => (ids.has(r.id) ? { ...r, status: "ordered" as const } : r))
    );
    toast.success(list.length === 1 ? "Reorder approved" : "Reorders approved", {
      description:
        list.length === 1
          ? `${list[0].id} is now with ${list[0].supplier}.`
          : `${list.length} reorders are now with their suppliers.`,
    });
  }

  function handleCancel(reorder: PurchaseReorder) {
    setReorders((prev) => prev.filter((r) => r.id !== reorder.id));
  }

  function handleExport() {
    exportLowStockCsv(filteredAlerts);
    toast.success("Low stock items exported", {
      description: `${filteredAlerts.length} item${filteredAlerts.length === 1 ? "" : "s"} downloaded as CSV.`,
    });
  }

  function clearFilters() {
    setFilters(INITIAL_FILTERS);
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Reorder / Low Stock"
        subtitle="Monitor inventory levels and manage purchase reorders"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download data-icon="inline-start" />
              Export
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus data-icon="inline-start" />
              Create Reorder
            </Button>
          </>
        }
      />

      <ReorderSummaryCards {...summary} />

      <Card className="flex flex-col gap-4 p-5">
        <ReorderToolbar
          filters={filters}
          onChange={setFilters}
          warehouses={REORDER_WAREHOUSES}
          categories={[...PRODUCT_CATEGORIES]}
          suppliers={suppliers}
        />

        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <p className="text-sm font-semibold text-text">No low stock items found</p>
            <p className="max-w-xs text-[12.5px] text-text-3">
              Nothing matches the current search or filters.
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <LowStockTable items={filteredAlerts} onQuickReorder={openQuickReorder} />
        )}
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="text-[15px] font-bold text-text min-[1440px]:text-base">Pending Reorders</h2>
          <p className="mt-0.5 text-[12.5px] text-text-3 min-[1440px]:text-[13.5px]">
            Track active purchase orders — search and supplier filters apply here too.
          </p>
        </div>

        {filteredReorders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <p className="text-sm font-semibold text-text">No reorders found</p>
            <p className="max-w-xs text-[12.5px] text-text-3">
              Nothing matches the current search or supplier filter.
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <PendingReordersTable
            items={filteredReorders}
            onEdit={openEditReorder}
            onApprove={handleApprove}
            onCancel={handleCancel}
          />
        )}
      </Card>

      <CreateReorderDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setQuickItem(null);
            setEditTarget(null);
          }
        }}
        items={lowStockSeed}
        quickItem={quickItem}
        editReorder={editTarget}
        defaultDelivery={defaultDelivery}
        onSave={handleSave}
      />
    </div>
  );
}
