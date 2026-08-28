"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
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
import { ApiError } from "@/lib/api/errors";
import { toast } from "@/lib/toast";
import {
  useDeleteWarehouse,
  useUpdateWarehouse,
  useWarehouse,
} from "../hooks/use-inventory";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="text-[12.5px] text-text-3">{label}</span>
      <span className="text-right text-[12.5px] font-medium text-text">{value}</span>
    </div>
  );
}

export function WarehouseDetailsPage({ warehouseId }: { warehouseId: string }) {
  const router = useRouter();
  const { data: detail, isLoading, isError } = useWarehouse(warehouseId);
  const deleteWarehouse = useDeleteWarehouse();
  const updateWarehouse = useUpdateWarehouse();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "inactive">("active");

  function handleOpenEdit() {
    if (!detail) return;
    setEditName(detail.name);
    setEditCode(detail.code);
    setEditAddress(detail.address || "");
    setEditStatus(detail.status);
    setEditOpen(true);
  }

  async function handleEdit() {
    if (!detail) return;
    if (!editName.trim() || !editCode.trim()) {
      toast.error("Name and code are required");
      return;
    }
    try {
      await updateWarehouse.mutateAsync({
        id: detail.id,
        input: {
          name: editName.trim(),
          code: editCode.trim(),
          address: editAddress.trim() || undefined,
          status: editStatus === "inactive" ? "INACTIVE" : "ACTIVE",
        },
      });
      toast.success("Warehouse updated");
      setEditOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div>
        <Link href="/dashboard/warehouses" className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-text-3 hover:text-blue">
          <ArrowLeft className="size-3.5" />
          Back to Warehouses
        </Link>
        <p className="mt-2 text-sm text-text-2">Warehouse not found.</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/dashboard/warehouses" className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-text-3 hover:text-blue">
        <ArrowLeft className="size-3.5" />
        Back to Warehouses
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold text-text">{detail.name}</h1>
          <p className="mt-0.5 text-[12.5px] text-text-3">Code {detail.code}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={detail.status === "active" ? "green" : "neutral"}>
            {detail.status === "active" ? "Active" : "Inactive"}
          </Badge>
          <Button size="sm" variant="outline" onClick={handleOpenEdit}>
            <Pencil data-icon="inline-start" />
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDeleteOpen(true)}>
            <Trash2 data-icon="inline-start" />
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="gap-0 p-4">
          <div className="text-[11.5px] text-text-3">Products with stock</div>
          <div className="mt-1 text-lg font-extrabold">{detail.productCount}</div>
        </Card>
        <Card className="gap-0 p-4">
          <div className="text-[11.5px] text-text-3">Total on hand</div>
          <div className="mt-1 text-lg font-extrabold">{detail.totalOnHand}</div>
        </Card>
        <Card className="gap-0 p-4">
          <div className="text-[11.5px] text-text-3">Damaged</div>
          <div className={detail.totalDamaged > 0 ? "mt-1 text-lg font-extrabold text-amber" : "mt-1 text-lg font-extrabold"}>
            {detail.totalDamaged}
          </div>
        </Card>
        <Card className="gap-0 p-4">
          <div className="text-[11.5px] text-text-3">Reserved</div>
          <div className="mt-1 text-lg font-extrabold">{detail.totalReserved}</div>
        </Card>
      </div>

      <Card className="mt-5 max-w-xl gap-0 p-5">
        <DetailRow label="Code" value={detail.code} />
        <DetailRow label="Location" value={detail.address || "—"} />
        <DetailRow label="Status" value={detail.status === "active" ? "Active" : "Inactive"} />
      </Card>

      <div className="mt-6">
        <h2 className="mb-3 text-[14px] font-semibold text-text">Products in this warehouse</h2>
        <Card className="p-0">
          {!detail.products?.length ? (
            <p className="py-8 text-center text-[13px] text-text-3">No stock in this warehouse.</p>
          ) : (
            <div className="overflow-x-auto rounded-[10px] border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-subtle hover:bg-surface-subtle">
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Damaged</TableHead>
                    <TableHead className="text-right">Reserved</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.products.map((p) => (
                    <TableRow key={p.productId}>
                      <TableCell className="font-semibold">{p.name}</TableCell>
                      <TableCell className="tabular-nums text-text-2">{p.sku}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{p.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.damagedQuantity}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.reservedQuantity}</TableCell>
                      <TableCell>
                        <Badge tone={p.status === "active" ? "green" : "neutral"}>
                          {p.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
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
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete warehouse?"
        description="Only empty warehouses with no stock history can be deleted. Otherwise set status to Inactive."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          try {
            await deleteWarehouse.mutateAsync(detail.id);
            toast.success("Warehouse deleted");
            router.push("/dashboard/warehouses");
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
