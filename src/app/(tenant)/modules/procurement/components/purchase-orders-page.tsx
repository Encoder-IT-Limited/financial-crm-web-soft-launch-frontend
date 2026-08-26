"use client";

import { useMemo, useState } from "react";
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
import { fmtMoney } from "@/lib/format";
import { toast } from "@/lib/toast";
import { useProducts, useWarehouses } from "@/app/(tenant)/modules/inventory/hooks/use-inventory";
import {
  useApprovePurchaseOrder,
  useCreatePurchaseOrder,
  usePurchaseOrders,
  useSubmitPurchaseOrder,
  useSuppliers,
} from "../hooks/use-procurement";

const statusTone: Record<string, "amber" | "blue" | "green" | "neutral" | "red"> = {
  DRAFT: "neutral",
  PENDING_APPROVAL: "amber",
  APPROVED: "green",
  REJECTED: "red",
  CLOSED: "blue",
  CANCELLED: "neutral",
};

export function PurchaseOrdersPage() {
  const { data: orders = [], isLoading } = usePurchaseOrders();
  const { data: suppliers = [] } = useSuppliers();
  const { data: warehouses = [] } = useWarehouses();
  const { data: products = [] } = useProducts();
  const createPo = useCreatePurchaseOrder();
  const submitPo = useSubmitPurchaseOrder();
  const approvePo = useApprovePurchaseOrder();

  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [unitCost, setUnitCost] = useState("0");

  const supplierById = useMemo(() => new Map(suppliers.map((s) => [s.id, s])), [suppliers]);

  function reset() {
    setSupplierId("");
    setWarehouseId("");
    setProductId("");
    setQuantity("10");
    setUnitCost("0");
  }

  async function handleCreate() {
    const qty = Number(quantity);
    const cost = Number(unitCost);
    if (!supplierId || !warehouseId || !productId || !(qty > 0)) {
      toast.error("Supplier, warehouse, product, and quantity are required");
      return;
    }
    try {
      await createPo.mutateAsync({
        supplierId,
        warehouseId,
        items: [{ productId, quantity: qty, unitCost: cost }],
      });
      toast.success("Draft PO created");
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  async function run(label: string, fn: () => Promise<unknown>) {
    try {
      await fn();
      toast.success(label);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Purchase Orders"
        subtitle="Draft → Submit → Approve, then receive on Goods Receipt"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" render={<Link href="/dashboard/vendors" />} nativeButton={false}>
              Vendors
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus data-icon="inline-start" />
              New PO
            </Button>
          </div>
        }
      />

      <Card className="p-5">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : orders.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-text-3">No purchase orders yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-[10px] border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-subtle hover:bg-surface-subtle">
                  <TableHead>PO #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-semibold tabular-nums">{po.poNumber}</TableCell>
                    <TableCell>{supplierById.get(po.supplierId)?.name ?? po.supplierId.slice(0, 8)}</TableCell>
                    <TableCell>
                      <Badge tone={statusTone[po.status] ?? "neutral"}>{po.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(po.total)}</TableCell>
                    <TableCell className="text-[12px] text-text-2">{po.items.length} line(s)</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {po.status === "DRAFT" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={submitPo.isPending}
                            onClick={() => run("Submitted", () => submitPo.mutateAsync(po.id))}
                          >
                            Submit
                          </Button>
                        )}
                        {po.status === "PENDING_APPROVAL" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={approvePo.isPending}
                            onClick={() => run("Approved", () => approvePo.mutateAsync(po.id))}
                          >
                            Approve
                          </Button>
                        )}
                        {po.status === "APPROVED" && (
                          <Button size="sm" variant="outline" render={<Link href="/dashboard/goods-receipt" />} nativeButton={false}>
                            Receive
                          </Button>
                        )}
                      </div>
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
        onOpenChange={(next) => {
          if (!next) reset();
          setOpen(next);
        }}
        title="New purchase order"
        description="Creates a draft PO with one line. Submit and approve before goods receipt."
        onSubmit={handleCreate}
        submitLabel="Create draft"
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
                  {s.name}
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
        <FormField label="Product">
          <Select
            value={productId}
            onValueChange={(v) => {
              setProductId(v ?? "");
              const p = products.find((x) => x.id === v);
              if (p) setUnitCost(String(p.costPrice));
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.sku})
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
      </FormDialog>
    </div>
  );
}
