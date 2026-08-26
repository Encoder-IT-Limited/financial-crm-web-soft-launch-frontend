"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormField } from "@/components/shared/form-field";
import { PageHeading } from "@/components/shared/page-heading";
import { ApiError } from "@/lib/api/errors";
import { toast } from "@/lib/toast";
import type { Warehouse } from "../types";
import {
  useDeleteWarehouse,
  useProducts,
  useReceiveStock,
  useUpdateWarehouse,
  useWarehouses,
} from "../hooks/use-inventory";

export function WarehousesPage() {
  const { data: items = [], isLoading } = useWarehouses();
  const { data: products = [] } = useProducts();
  const receiveStock = useReceiveStock();
  const updateWarehouse = useUpdateWarehouse();
  const deleteWarehouse = useDeleteWarehouse();

  const [search, setSearch] = useState("");
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");

  const [detail, setDetail] = useState<Warehouse | null>(null);
  const [edit, setEdit] = useState<Warehouse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "inactive">("active");

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((w) => `${w.name} ${w.code} ${w.address}`.toLowerCase().includes(needle));
  }, [items, search]);

  function resetReceive() {
    setWarehouseId("");
    setProductId("");
    setQuantity("");
    setUnitCost("");
  }

  function openEdit(w: Warehouse) {
    setEdit(w);
    setEditName(w.name);
    setEditCode(w.code);
    setEditAddress(w.address);
    setEditStatus(w.status);
  }

  async function handleReceive() {
    const qty = Number(quantity);
    const cost = Number(unitCost);
    if (!warehouseId || !productId || !(qty > 0) || !(cost >= 0)) {
      toast.error("Warehouse, product, quantity, and unit cost are required");
      return;
    }
    try {
      await receiveStock.mutateAsync({
        productId,
        warehouseId,
        quantity: qty,
        unitCost: cost,
        movementType: "OPENING",
      });
      toast.success("Stock received (batch auto-created if tracked)");
      resetReceive();
      setReceiveOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Receive failed");
    }
  }

  async function handleEdit() {
    if (!edit) return;
    if (!editName.trim() || !editCode.trim()) {
      toast.error("Name and code are required");
      return;
    }
    try {
      await updateWarehouse.mutateAsync({
        id: edit.id,
        input: {
          name: editName.trim(),
          code: editCode.trim(),
          address: editAddress.trim() || undefined,
          status: editStatus === "inactive" ? "INACTIVE" : "ACTIVE",
        },
      });
      toast.success("Warehouse updated");
      setEdit(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Warehouses"
        subtitle="Manage warehouse locations and opening / ad-hoc stock receive"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setReceiveOpen(true)}>
              Receive stock
            </Button>
            <Button render={<Link href="/dashboard/warehouses/new" />} nativeButton={false}>
              <Plus data-icon="inline-start" />
              Add Warehouse
            </Button>
          </div>
        }
      />

      <Card className="flex flex-col gap-4 p-5">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search warehouses..."
          className="h-9 max-w-sm border-border text-[12.5px]"
        />

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-text-3">No warehouses yet. Create your first location.</p>
        ) : (
          <div className="overflow-x-auto rounded-[10px] border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-subtle hover:bg-surface-subtle">
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>On hand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-semibold">{w.name}</TableCell>
                    <TableCell className="tabular-nums text-text-2">{w.code}</TableCell>
                    <TableCell className="text-text-3">{w.address || "—"}</TableCell>
                    <TableCell className="tabular-nums">{w.productCount}</TableCell>
                    <TableCell className="tabular-nums">{w.totalOnHand}</TableCell>
                    <TableCell>
                      <Badge tone={w.status === "active" ? "green" : "neutral"}>
                        {w.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label="View" onClick={() => setDetail(w)}>
                          <Eye />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => openEdit(w)}>
                          <Pencil />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => setDeleteTarget(w)}>
                          <Trash2 />
                        </Button>
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
        open={receiveOpen}
        onOpenChange={(next) => {
          if (!next) resetReceive();
          setReceiveOpen(next);
        }}
        title="Receive stock"
        description="Opening / non-PO receive. Creates a batch automatically when the product tracks batches."
        onSubmit={handleReceive}
        submitLabel="Receive"
        submitting={receiveStock.isPending}
      >
        <FormField label="Warehouse">
          <Select value={warehouseId} onValueChange={(v) => setWarehouseId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select warehouse" />
            </SelectTrigger>
            <SelectContent>
              {items.map((w) => (
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

      <FormDialog
        open={!!detail}
        onOpenChange={(next) => {
          if (!next) setDetail(null);
        }}
        title={detail?.name ?? "Warehouse"}
        description="Warehouse details"
        onSubmit={() => setDetail(null)}
        submitLabel="Close"
      >
        {detail && (
          <>
            <DetailLine label="Code" value={detail.code} />
            <DetailLine label="Location" value={detail.address || "—"} />
            <DetailLine label="Status" value={detail.status} />
            <DetailLine label="Products with stock" value={String(detail.productCount)} />
            <DetailLine label="Total on hand" value={String(detail.totalOnHand)} />
          </>
        )}
      </FormDialog>

      <FormDialog
        open={!!edit}
        onOpenChange={(next) => {
          if (!next) setEdit(null);
        }}
        title="Edit warehouse"
        onSubmit={handleEdit}
        submitLabel="Save"
        submitting={updateWarehouse.isPending}
      >
        <FormField label="Name">
          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9" />
        </FormField>
        <FormField label="Code">
          <Input value={editCode} onChange={(e) => setEditCode(e.target.value)} className="h-9" />
        </FormField>
        <FormField label="Location">
          <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="h-9" />
        </FormField>
        <FormField label="Status">
          <Select value={editStatus} onValueChange={(v) => setEditStatus((v as "active" | "inactive") ?? "active")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </FormDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
        title="Delete warehouse?"
        description="Only empty warehouses with no stock history can be deleted. Otherwise set status to Inactive."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteWarehouse.mutateAsync(deleteTarget.id);
            toast.success("Warehouse deleted");
          } catch (err) {
            if (err instanceof ApiError) {
              toast.error(err.message);
              return;
            }
            throw err;
          }
        }}
      />
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2 text-[12.5px] last:border-0">
      <span className="text-text-3">{label}</span>
      <span className="font-medium text-text">{value}</span>
    </div>
  );
}
