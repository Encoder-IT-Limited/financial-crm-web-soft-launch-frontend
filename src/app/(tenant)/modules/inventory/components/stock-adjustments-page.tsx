"use client";

import { useMemo, useState } from "react";
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
import {
  useAdjustStock,
  useMovements,
  useProducts,
  useWarehouses,
} from "../hooks/use-inventory";

export function StockAdjustmentsPage() {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: warehouses = [], isLoading: warehousesLoading } = useWarehouses();
  const { data: movements = [], isLoading: movementsLoading } = useMovements();
  const adjustStock = useAdjustStock();

  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [direction, setDirection] = useState<"add" | "deduct">("add");
  const [quantity, setQuantity] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const warehouseById = useMemo(() => new Map(warehouses.map((w) => [w.id, w])), [warehouses]);

  const adjustments = useMemo(
    () => movements.filter((m) => m.movementType === "ADJUSTMENT"),
    [movements],
  );

  const loading = productsLoading || warehousesLoading || movementsLoading;

  function reset() {
    setProductId("");
    setWarehouseId("");
    setDirection("add");
    setQuantity("");
    setErrors({});
  }

  async function handleSubmit() {
    const qty = Number(quantity);
    const nextErrors: Record<string, string> = {};
    if (!productId) nextErrors.productId = "Select a product";
    if (!warehouseId) nextErrors.warehouseId = "Select a warehouse";
    if (!Number.isFinite(qty) || qty <= 0) nextErrors.quantity = "Enter a positive quantity";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    try {
      await adjustStock.mutateAsync({
        productId,
        warehouseId,
        quantityDelta: direction === "add" ? qty : -qty,
      });
      toast.success("Stock adjusted");
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Adjustment failed");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Stock Adjustments"
        subtitle="Correct on-hand quantities (Owner/Manager)"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus data-icon="inline-start" />
            New Adjustment
          </Button>
        }
      />

      <Card className="p-5">
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : adjustments.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-text-3">
            No adjustments yet. Record a stock correction to start.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-[10px] border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-subtle hover:bg-surface-subtle">
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Qty Δ</TableHead>
                  <TableHead>Unit Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((m) => {
                  const product = productById.get(m.productId);
                  const warehouse = warehouseById.get(m.warehouseId);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="tabular-nums text-text-2">
                        {new Date(m.movementDate).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {product ? `${product.name} (${product.sku})` : m.productId.slice(0, 8)}
                      </TableCell>
                      <TableCell>{warehouse?.name ?? m.warehouseId.slice(0, 8)}</TableCell>
                      <TableCell>
                        <Badge tone={m.quantity >= 0 ? "green" : "red"}>
                          {m.quantity >= 0 ? "+" : ""}
                          {m.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">{m.unitCost.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
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
        title="New Stock Adjustment"
        description="Positive adds stock; deduct reduces on-hand at the selected warehouse."
        onSubmit={handleSubmit}
        submitLabel="Apply Adjustment"
        submitting={adjustStock.isPending}
      >
        <FormField label="Product" error={errors.productId}>
          <Select value={productId} onValueChange={(v) => setProductId(v ?? "")}>
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
        <FormField label="Warehouse" error={errors.warehouseId}>
          <Select value={warehouseId} onValueChange={(v) => setWarehouseId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select warehouse" />
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
        <FormField label="Type">
          <Select value={direction} onValueChange={(v) => setDirection((v as "add" | "deduct") ?? "add")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="add">Add stock</SelectItem>
              <SelectItem value="deduct">Deduct stock</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Quantity" error={errors.quantity}>
          <Input
            type="number"
            min={0.01}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-9 border-border text-[12.5px]"
          />
        </FormField>
      </FormDialog>
    </div>
  );
}
