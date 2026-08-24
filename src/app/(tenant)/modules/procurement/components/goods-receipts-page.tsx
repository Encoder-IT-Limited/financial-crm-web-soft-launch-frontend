"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PackageCheck, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormField } from "@/components/shared/form-field";
import { PageHeading } from "@/components/shared/page-heading";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { useProducts, useWarehouses } from "@/app/(tenant)/modules/inventory/hooks/use-inventory";
import { useCreateGoodsReceipt, usePurchaseOrders, useSuppliers } from "../hooks/use-procurement";
import type { PurchaseOrder } from "../api/procurement.service";

export function GoodsReceiptsPage() {
  const { data: orders = [], isLoading } = usePurchaseOrders();
  const { data: suppliers = [] } = useSuppliers();
  const { data: warehouses = [] } = useWarehouses();
  const { data: products = [] } = useProducts();
  const [open, setOpen] = useState(false);

  const approved = useMemo(() => orders.filter((o) => o.status === "APPROVED"), [orders]);

  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? id.slice(0, 8);
  const warehouseName = (id: string) => warehouses.find((w) => w.id === id)?.name ?? id.slice(0, 8);
  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? id.slice(0, 8);

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Goods Receipt"
        subtitle="Receive stock against approved purchase orders"
        actions={
          <Button onClick={() => setOpen(true)} disabled={approved.length === 0}>
            <Plus data-icon="inline-start" />
            Record Receipt
          </Button>
        }
      />

      <Card className="flex flex-col gap-4 p-5">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <PackageCheck className="size-8 text-text-4" />
            <p className="text-sm font-semibold text-text">No purchase orders yet</p>
            <p className="max-w-sm text-[12.5px] text-text-3">
              Create a vendor and purchase order, approve it, then record the receipt here.
            </p>
            <Button size="sm" className="mt-2" render={<Link href="/dashboard/purchase-orders" />} nativeButton={false}>
              Go to purchase orders
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[10px] border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-subtle hover:bg-surface-subtle">
                  <TableHead>PO</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Lines</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-semibold tabular-nums">{po.poNumber}</TableCell>
                    <TableCell>{supplierName(po.supplierId)}</TableCell>
                    <TableCell>{warehouseName(po.warehouseId)}</TableCell>
                    <TableCell>
                      <Badge tone={po.status === "APPROVED" ? "green" : "neutral"}>{po.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{po.items.length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <RecordReceiptDialog
        open={open}
        onOpenChange={setOpen}
        purchaseOrders={approved}
        productLabel={productName}
      />
    </div>
  );
}

function RecordReceiptDialog({
  open,
  onOpenChange,
  purchaseOrders,
  productLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrders: PurchaseOrder[];
  productLabel: (productId: string) => string;
}) {
  const [poId, setPoId] = useState("");
  const [qtys, setQtys] = useState<Record<string, string>>({});
  const [batches, setBatches] = useState<Record<string, string>>({});
  const createReceipt = useCreateGoodsReceipt();

  const selected = purchaseOrders.find((p) => p.id === poId);

  function handlePoChange(id: string) {
    setPoId(id);
    const po = purchaseOrders.find((p) => p.id === id);
    const next: Record<string, string> = {};
    po?.items.forEach((item) => {
      next[item.productId] = String(item.quantity);
    });
    setQtys(next);
    setBatches({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const items = selected.items
      .map((item) => ({
        productId: item.productId,
        quantity: Number(qtys[item.productId] ?? 0),
        batchNumber: batches[item.productId]?.trim() || undefined,
      }))
      .filter((i) => i.quantity > 0);

    if (items.length === 0) {
      toast.error("Enter at least one received quantity");
      return;
    }

    try {
      await createReceipt.mutateAsync({ purchaseOrderId: selected.id, items });
      toast.success("Goods receipt recorded", {
        description: "Stock updated; batch created automatically when blank.",
      });
      onOpenChange(false);
      setPoId("");
      setQtys({});
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not record receipt");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record Receipt</DialogTitle>
          <DialogDescription>
            Select an approved PO. Leave batch blank to auto-generate on the server.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Purchase Order">
            <Select value={poId} onValueChange={(id) => handlePoChange(id ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select approved PO" />
              </SelectTrigger>
              <SelectContent>
                {purchaseOrders.map((po) => (
                  <SelectItem key={po.id} value={po.id}>
                    {po.poNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {selected && (
            <div className="overflow-x-auto rounded-[10px] border border-border">
              <table className="w-full text-[12.5px]">
                <thead className="bg-surface-subtle text-left text-[11px] font-semibold text-text-2">
                  <tr>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2 text-right">Ordered</th>
                    <th className="px-3 py-2">Receive</th>
                    <th className="px-3 py-2">Batch (optional)</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-3 py-2 font-medium">{productLabel(item.productId)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.001"
                          className="h-8"
                          value={qtys[item.productId] ?? ""}
                          onChange={(e) => setQtys((prev) => ({ ...prev, [item.productId]: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          className="h-8"
                          placeholder="Auto if blank"
                          value={batches[item.productId] ?? ""}
                          onChange={(e) => setBatches((prev) => ({ ...prev, [item.productId]: e.target.value }))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selected || createReceipt.isPending}>
              {createReceipt.isPending ? "Recording..." : "Submit Receipt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
