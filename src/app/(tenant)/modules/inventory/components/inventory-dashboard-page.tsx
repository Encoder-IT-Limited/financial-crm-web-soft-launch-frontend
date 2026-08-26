"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Boxes,
  ClipboardCheck,
  Package,
  PackageSearch,
  Warehouse,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { PageHeading } from "@/components/shared/page-heading";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  useMovements,
  useProducts,
  useStock,
  useWarehouses,
} from "../hooks/use-inventory";

const headClass = "text-[11px] font-semibold uppercase tracking-wide text-text-3";

export function InventoryDashboardPage() {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: warehouses = [], isLoading: warehousesLoading } = useWarehouses();
  const { data: stock = [], isLoading: stockLoading } = useStock();
  const { data: movements = [], isLoading: movementsLoading } = useMovements();

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const warehouseById = useMemo(() => new Map(warehouses.map((w) => [w.id, w])), [warehouses]);

  const stockValue = useMemo(
    () => stock.reduce((sum, row) => sum + row.quantity * row.averageCost, 0),
    [stock],
  );

  const warehouseValues = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of stock) {
      map.set(row.warehouseId, (map.get(row.warehouseId) ?? 0) + row.quantity * row.averageCost);
    }
    const total = Math.max(stockValue, 1);
    return [...map.entries()]
      .map(([warehouseId, value]) => ({
        warehouseId,
        name: warehouseById.get(warehouseId)?.name ?? warehouseId.slice(0, 8),
        value,
        pct: (value / total) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [stock, stockValue, warehouseById]);

  const adjustments = movements.filter((m) => m.movementType === "ADJUSTMENT").length;
  const receipts = movements.filter((m) =>
    ["PURCHASE_RECEIPT", "OPENING", "TRANSFER_IN", "SALES_RETURN"].includes(m.movementType),
  ).length;

  const lowStock = useMemo(() => {
    return products
      .filter((p) => p.status === "active" && p.stock <= Math.max(p.reorderLevel, p.minimumStock))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 8);
  }, [products]);

  const recent = movements.slice(0, 10);
  const loading = productsLoading || warehousesLoading || stockLoading || movementsLoading;

  const kpis = [
    {
      id: "products",
      label: "Total Products",
      value: String(products.length),
      icon: Package,
      tone: "blue",
      note: "active catalog",
    },
    {
      id: "warehouses",
      label: "Warehouses",
      value: String(warehouses.length),
      icon: Warehouse,
      tone: "purple",
      note: "locations",
    },
    {
      id: "value",
      label: "Stock Value (WAC)",
      value: fmtMoney(stockValue),
      icon: Boxes,
      tone: "green",
      note: "on-hand × avg cost",
    },
    {
      id: "adj",
      label: "Adjustments",
      value: String(adjustments),
      icon: ClipboardCheck,
      tone: "amber",
      note: "in recent ledger",
    },
    {
      id: "recv",
      label: "Inbound moves",
      value: String(receipts),
      icon: PackageSearch,
      tone: "red",
      note: "receipts / returns / in",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Inventory"
        subtitle="Live stock overview from products, balances, and movements"
        actions={
          <Button variant="outline" render={<Link href="/dashboard/products" />} nativeButton={false}>
            Manage products
          </Button>
        }
      />

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {kpis.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.id} className="gap-0 p-4">
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-lg",
                      item.tone === "blue" && "bg-blue-l text-blue",
                      item.tone === "purple" && "bg-purple-l text-purple",
                      item.tone === "green" && "bg-green-l text-green",
                      item.tone === "amber" && "bg-amber-l text-amber",
                      item.tone === "red" && "bg-red-l text-red",
                    )}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  <div className="mt-3 text-[11.5px] font-medium text-text-3">{item.label}</div>
                  <div className="mt-0.5 text-xl font-extrabold tracking-tight text-text">{item.value}</div>
                  <div className="mt-1.5 text-[11.5px] text-text-4">{item.note}</div>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-4 text-sm font-bold text-text">Stock value by warehouse</h2>
              {warehouseValues.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-text-3">No stock balances yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {warehouseValues.map((w) => (
                    <div key={w.warehouseId} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="font-medium text-text">{w.name}</span>
                        <span className="tabular-nums text-text-2">
                          {fmtMoney(w.value)} · {w.pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-subtle">
                        <div className="h-full rounded-full bg-blue" style={{ width: `${Math.min(100, w.pct)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-text">Recent movements</h2>
                <Button variant="outline" size="sm" render={<Link href="/dashboard/stock-movement" />} nativeButton={false}>
                  View all
                </Button>
              </div>
              {recent.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-text-3">No movements yet.</p>
              ) : (
                <Table className="text-[12.5px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className={headClass}>Date</TableHead>
                      <TableHead className={headClass}>Type</TableHead>
                      <TableHead className={headClass}>Product</TableHead>
                      <TableHead className={`text-right ${headClass}`}>Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.map((m) => {
                      const product = productById.get(m.productId);
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="whitespace-nowrap text-text-2">
                            {new Date(m.movementDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge tone={m.quantity >= 0 ? "green" : "red"}>{m.movementType}</Badge>
                          </TableCell>
                          <TableCell>{product?.name ?? m.productId.slice(0, 8)}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">
                            {m.quantity >= 0 ? "+" : ""}
                            {m.quantity}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-text">Low stock</h2>
              <Button variant="outline" size="sm" render={<Link href="/dashboard/reorder" />} nativeButton={false}>
                Reorder list
              </Button>
            </div>
            {lowStock.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-text-3">No products at or below reorder level.</p>
            ) : (
              <Table className="text-[12.5px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={headClass}>Product</TableHead>
                    <TableHead className={headClass}>SKU</TableHead>
                    <TableHead className={`text-right ${headClass}`}>On hand</TableHead>
                    <TableHead className={`text-right ${headClass}`}>Reorder</TableHead>
                    <TableHead className={`text-right ${headClass}`}>Min</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="tabular-nums text-text-3">{p.sku}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-red">{p.stock}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.reorderLevel}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.minimumStock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" render={<Link href="/dashboard/stock-transfer" />} nativeButton={false}>
              <ArrowLeftRight data-icon="inline-start" />
              Transfers
            </Button>
            <Button variant="outline" size="sm" render={<Link href="/dashboard/valuation" />} nativeButton={false}>
              Valuation
            </Button>
            <Button variant="outline" size="sm" render={<Link href="/dashboard/batches" />} nativeButton={false}>
              Batches
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
