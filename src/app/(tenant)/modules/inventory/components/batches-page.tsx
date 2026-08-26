"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useBatches, useProducts, useWarehouses } from "../hooks/use-inventory";

export function BatchesPage() {
  const { data: batches = [], isLoading } = useBatches();
  const { data: products = [] } = useProducts();
  const { data: warehouses = [] } = useWarehouses();
  const [search, setSearch] = useState("");

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const warehouseById = useMemo(() => new Map(warehouses.map((w) => [w.id, w])), [warehouses]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return batches;
    return batches.filter((b) => {
      const p = productById.get(b.productId);
      const w = warehouseById.get(b.warehouseId);
      return `${b.batchNumber} ${p?.name ?? ""} ${p?.sku ?? ""} ${w?.name ?? ""}`.toLowerCase().includes(needle);
    });
  }, [batches, productById, warehouseById, search]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Batches"
        subtitle="Batch lots created automatically on stock receive (read-only list)"
      />

      <Card className="flex flex-col gap-4 p-5">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search batch, SKU, product, warehouse..."
          className="h-9 max-w-sm border-border text-[12.5px]"
        />
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-text-3">
            No batches yet. Receive stock or record a goods receipt to create them.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-[10px] border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-subtle hover:bg-surface-subtle">
                  <TableHead>Batch #</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => {
                  const product = productById.get(b.productId);
                  const warehouse = warehouseById.get(b.warehouseId);
                  const expired = b.expiryDate ? new Date(b.expiryDate) < new Date() : false;
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-semibold tabular-nums">{b.batchNumber}</TableCell>
                      <TableCell>
                        {product ? `${product.name} (${product.sku})` : b.productId.slice(0, 8)}
                      </TableCell>
                      <TableCell>{warehouse?.name ?? b.warehouseId.slice(0, 8)}</TableCell>
                      <TableCell className="text-right tabular-nums">{b.quantity}</TableCell>
                      <TableCell>
                        {b.expiryDate ? (
                          <Badge tone={expired ? "red" : "neutral"}>{b.expiryDate}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums text-text-2">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
