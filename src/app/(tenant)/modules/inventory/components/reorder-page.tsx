"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormField } from "@/components/shared/form-field";
import { PageHeading } from "@/components/shared/page-heading";
import { ApiError } from "@/lib/api/errors";
import { toast } from "@/lib/toast";
import { useReorder, useWarehouses } from "../hooks/use-inventory";
import { useCreatePurchaseOrder, useSuppliers } from "@/app/(tenant)/modules/procurement/hooks/use-procurement";

export function ReorderPage() {
  const { data: lowStock = [], isLoading } = useReorder();
  const { data: suppliers = [] } = useSuppliers();
  const { data: warehouses = [] } = useWarehouses();
  const createPo = useCreatePurchaseOrder();

  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");

  function openFor(productIdValue: string) {
    const p = lowStock.find((x) => x.productId === productIdValue);
    setProductId(productIdValue);
    setQuantity(String(p?.suggestedQuantity ?? 1));
    setUnitCost(String(p?.costPrice ?? 0));
    setOpen(true);
  }

  async function handleCreatePo() {
    const qty = Number(quantity);
    const cost = Number(unitCost);
    if (!productId || !supplierId || !warehouseId || !(qty > 0) || !(cost >= 0)) {
      toast.error("Fill supplier, warehouse, quantity, and cost");
      return;
    }
    try {
      await createPo.mutateAsync({
        supplierId,
        warehouseId,
        items: [{ productId, quantity: qty, unitCost: cost }],
      });
      toast.success("Draft PO created — submit & approve under Purchase Orders");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create PO");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Reorder / Low Stock"
        subtitle="Products at or below reorder / minimum stock"
        actions={
          <Button variant="outline" render={<Link href="/dashboard/purchase-orders" />} nativeButton={false}>
            Purchase orders
          </Button>
        }
      />

      <Card className="p-5">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : lowStock.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-text-3">All products are above reorder levels.</p>
        ) : (
          <div className="overflow-x-auto rounded-[10px] border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-subtle hover:bg-surface-subtle">
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Reorder</TableHead>
                  <TableHead className="text-right">Minimum</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                  {lowStock.map((p) => (
                    <TableRow key={p.productId}>
                      <TableCell className="font-semibold">{p.name}</TableCell>
                      <TableCell className="tabular-nums text-text-2">{p.sku}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-red">{p.stock}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.reorderLevel}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.minimumStock}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openFor(p.productId)}>
                        <Plus data-icon="inline-start" />
                        Create PO
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Create purchase order"
        description={
          suppliers.length === 0
            ? "Add a vendor first under Vendors, then create the PO."
            : "Creates a draft PO for the selected product."
        }
        onSubmit={handleCreatePo}
        submitLabel="Create draft PO"
        submitting={createPo.isPending}
      >
        <FormField label="Supplier">
          <Select value={supplierId} onValueChange={(v) => setSupplierId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.supplierCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Warehouse">
          <Select value={warehouseId} onValueChange={(v) => setWarehouseId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Receive into" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Quantity">
          <Input type="number" min={0.01} step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-9" />
        </FormField>
        <FormField label="Unit cost">
          <Input type="number" min={0} step="any" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="h-9" />
        </FormField>
        {productId && (
          <p className="text-[12px] text-text-3">
            Product: <Badge tone="neutral">{lowStock.find((p) => p.productId === productId)?.sku}</Badge>
          </p>
        )}
      </FormDialog>
    </div>
  );
}
