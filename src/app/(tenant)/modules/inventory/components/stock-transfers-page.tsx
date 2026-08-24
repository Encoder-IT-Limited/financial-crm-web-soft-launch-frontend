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
  useApproveTransfer,
  useCreateTransfer,
  useDispatchTransfer,
  useProducts,
  useReceiveTransfer,
  useTransfers,
  useWarehouses,
} from "../hooks/use-inventory";
import type { StockTransfer } from "../types";

const statusTone: Record<string, "amber" | "blue" | "green" | "neutral"> = {
  PENDING: "amber",
  APPROVED: "blue",
  DISPATCHED: "blue",
  RECEIVED: "green",
};

export function StockTransfersPage() {
  const { data: transfers = [], isLoading } = useTransfers();
  const { data: products = [] } = useProducts();
  const { data: warehouses = [] } = useWarehouses();
  const createTransfer = useCreateTransfer();
  const approveTransfer = useApproveTransfer();
  const dispatchTransfer = useDispatchTransfer();
  const receiveTransfer = useReceiveTransfer();

  const [open, setOpen] = useState(false);
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const warehouseById = useMemo(() => new Map(warehouses.map((w) => [w.id, w])), [warehouses]);
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  function reset() {
    setFromWarehouseId("");
    setToWarehouseId("");
    setProductId("");
    setQuantity("");
    setErrors({});
  }

  async function handleCreate() {
    const qty = Number(quantity);
    const nextErrors: Record<string, string> = {};
    if (!fromWarehouseId) nextErrors.fromWarehouseId = "Required";
    if (!toWarehouseId) nextErrors.toWarehouseId = "Required";
    if (fromWarehouseId && toWarehouseId && fromWarehouseId === toWarehouseId) {
      nextErrors.toWarehouseId = "Must differ from source";
    }
    if (!productId) nextErrors.productId = "Required";
    if (!Number.isFinite(qty) || qty <= 0) nextErrors.quantity = "Enter a positive quantity";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    try {
      await createTransfer.mutateAsync({
        fromWarehouseId,
        toWarehouseId,
        items: [{ productId, quantity: qty }],
      });
      toast.success("Transfer requested");
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Transfer failed");
    }
  }

  async function runAction(label: string, fn: () => Promise<unknown>) {
    try {
      await fn();
      toast.success(label);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    }
  }

  function actionsFor(t: StockTransfer) {
    if (t.status === "PENDING") {
      return (
        <Button
          size="sm"
          variant="outline"
          disabled={approveTransfer.isPending}
          onClick={() => runAction("Approved", () => approveTransfer.mutateAsync(t.id))}
        >
          Approve
        </Button>
      );
    }
    if (t.status === "APPROVED") {
      return (
        <Button
          size="sm"
          variant="outline"
          disabled={dispatchTransfer.isPending}
          onClick={() => runAction("Dispatched", () => dispatchTransfer.mutateAsync(t.id))}
        >
          Dispatch
        </Button>
      );
    }
    if (t.status === "DISPATCHED") {
      return (
        <Button
          size="sm"
          variant="outline"
          disabled={receiveTransfer.isPending}
          onClick={() => runAction("Received", () => receiveTransfer.mutateAsync(t.id))}
        >
          Receive
        </Button>
      );
    }
    return null;
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Stock Transfers"
        subtitle="Request → Approve → Dispatch → Receive"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus data-icon="inline-start" />
            New Transfer
          </Button>
        }
      />

      <Card className="p-5">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : transfers.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-text-3">No transfers yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-[10px] border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-subtle hover:bg-surface-subtle">
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{warehouseById.get(t.fromWarehouseId)?.name ?? t.fromWarehouseId.slice(0, 8)}</TableCell>
                    <TableCell>{warehouseById.get(t.toWarehouseId)?.name ?? t.toWarehouseId.slice(0, 8)}</TableCell>
                    <TableCell className="text-[12.5px] text-text-2">
                      {t.items
                        .map((i) => {
                          const p = productById.get(i.productId);
                          return `${p?.sku ?? i.productId.slice(0, 6)} × ${i.quantity}`;
                        })
                        .join(", ")}
                    </TableCell>
                    <TableCell>
                      <Badge tone={statusTone[t.status] ?? "neutral"}>{t.status}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums text-text-2">
                      {new Date(t.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">{actionsFor(t)}</TableCell>
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
        title="Request Stock Transfer"
        description="Moves stock between warehouses after approval and dispatch."
        onSubmit={handleCreate}
        submitLabel="Request Transfer"
        submitting={createTransfer.isPending}
      >
        <FormField label="From warehouse" error={errors.fromWarehouseId}>
          <Select value={fromWarehouseId} onValueChange={(v) => setFromWarehouseId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Source" />
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
        <FormField label="To warehouse" error={errors.toWarehouseId}>
          <Select value={toWarehouseId} onValueChange={(v) => setToWarehouseId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Destination" />
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
