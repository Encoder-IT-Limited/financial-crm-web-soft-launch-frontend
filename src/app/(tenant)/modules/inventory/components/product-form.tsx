"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Boxes, Globe2, Save, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeading } from "@/components/shared/page-heading";
import { FormField } from "@/components/shared/form-field";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { fmtMoney, nextSequence } from "@/lib/format";
import type { Product, ProductStatus } from "../types";
import { CATEGORIES, PRODUCT_STATUS_LABELS, UNITS } from "../types";
import { productFormSchema } from "../schemas";
import { inventoryApi } from "../api/inventory.service";
import { useInventoryStore } from "../store/inventory-store";

export default function ProductFormPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />}>
      <ProductForm />
    </Suspense>
  );
}

type WarehouseInitRow = {
  warehouseId: string;
  available: string;
  reorderLevel: string;
  reorderQuantity: string;
  averageCost: string;
};

function emptyInits(warehouseIds: string[]): WarehouseInitRow[] {
  return warehouseIds.map((warehouseId) => ({
    warehouseId,
    available: "0",
    reorderLevel: "10",
    reorderQuantity: "25",
    averageCost: "0",
  }));
}

function ProductForm() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit");

  const warehouses = useInventoryStore((state) => state.warehouses);
  const productSeq = useInventoryStore((state) => state.productSeq);
  const [editing, setEditing] = useState<Product | null>(null);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [status, setStatus] = useState<ProductStatus>("active");
  const [trackBatch, setTrackBatch] = useState(false);
  const [trackExpiry, setTrackExpiry] = useState(false);
  const [description, setDescription] = useState("");
  const [costPrice, setCostPrice] = useState("0");
  const [sellingPrice, setSellingPrice] = useState("0");
  const [taxRate, setTaxRate] = useState("5");
  const [inits, setInits] = useState<WarehouseInitRow[]>(() => emptyInits(warehouses.map((w) => w.id)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Load the product being edited — /dashboard/products/new?edit=<id>
  useEffect(() => {
    if (!editId) return;
    inventoryApi.getProduct(editId).then((product) => {
      if (!product) {
        toast.error("Product not found");
        router.replace("/dashboard/products");
        return;
      }
      setEditing(product);
      setName(product.name);
      setSku(product.sku);
      setBarcode(product.barcode);
      setCategory(product.category);
      setUnit(product.unit);
      setStatus(product.status);
      setTrackBatch(product.trackBatch);
      setTrackExpiry(product.trackExpiry);
      setDescription(product.description ?? "");
      setCostPrice(String(product.costPrice));
      setSellingPrice(String(product.sellingPrice));
      setTaxRate(String(product.taxRate));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const suggestedSku = useMemo(() => `SKU-${nextSequence(productSeq)}`, [productSeq]);

  function setInit(warehouseId: string, field: keyof WarehouseInitRow, value: string) {
    setInits((rows) => rows.map((r) => (r.warehouseId === warehouseId ? { ...r, [field]: value } : r)));
    setErrors((e) => {
      const next = { ...e };
      delete next[`init.${warehouseId}.${field}`];
      return next;
    });
  }

  function validate(): boolean {
    const result = productFormSchema.safeParse({
      name,
      sku,
      barcode,
      category,
      unit,
      status,
      trackBatch,
      trackExpiry,
      description,
      costPrice,
      sellingPrice,
      taxRate,
      warehouseInit: inits.map((i) => ({
        warehouseId: i.warehouseId,
        available: i.available,
        reorderLevel: i.reorderLevel,
        reorderQuantity: i.reorderQuantity,
        averageCost: i.averageCost,
      })),
    });
    if (result.success) {
      setErrors({});
      return true;
    }
    const mapped: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const [first, ...rest] = issue.path;
      if (typeof first === "string") mapped[first] = issue.message;
      else if (typeof first === "number") {
        const row = inits[first];
        if (row && typeof rest[0] === "string") mapped[`init.${row.warehouseId}.${rest[0]}`] = issue.message;
      }
    }
    setErrors(mapped);
    return false;
  }

  async function handleSave() {
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    const input = {
      sku,
      barcode,
      name,
      category,
      unit,
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      taxRate: Number(taxRate) || 0,
      trackBatch,
      trackExpiry,
      status,
      description: description.trim() || undefined,
    };
    try {
      if (editing) {
        await inventoryApi.updateProduct(editing.id, input);
        toast.success(`${editing.sku} updated`);
        router.replace(`/dashboard/products/${editing.id}`);
      } else {
        const created = await inventoryApi.createProduct(
          input,
          inits.map((i) => ({
            warehouseId: i.warehouseId,
            available: Number(i.available) || 0,
            reorderLevel: Number(i.reorderLevel) || 0,
            reorderQuantity: Number(i.reorderQuantity) || 0,
            averageCost: Number(i.averageCost) || Number(costPrice) || 0,
          }))
        );
        toast.success(`${created.sku} created with opening stock`);
        router.replace(`/dashboard/products/${created.id}`);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const margin = Number(sellingPrice) - Number(costPrice);
  const marginPct = Number(costPrice) > 0 ? Math.round((margin / Number(costPrice)) * 100) : 0;

  return (
    <div>
      <PageHeading
        title={editing ? `Edit ${editing.sku}` : "New Product"}
        subtitle={
          editing
            ? "Global product details — per-warehouse stock is managed on the product page"
            : "Create the product, then set opening stock per warehouse"
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft /> Back
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <Card className="gap-0 p-0">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <Globe2 className="size-4 text-blue" />
            <div className="text-sm font-bold text-text">General Information</div>
          </div>
          <div className="flex flex-col gap-4 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Product name" error={errors.name}>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors({ ...errors, name: "" });
                  }}
                  placeholder="e.g. Wireless Keyboard Arabic Layout"
                  aria-invalid={!!errors.name}
                  className={cn(errors.name && "border-red")}
                />
              </FormField>
              <FormField label="SKU" error={errors.sku}>
                <div className="flex gap-1.5">
                  <Input
                    value={sku}
                    onChange={(e) => {
                      setSku(e.target.value);
                      setErrors({ ...errors, sku: "" });
                    }}
                    placeholder={suggestedSku}
                  />
                  {!sku && !editing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="Generate SKU"
                      onClick={() => setSku(suggestedSku)}
                    >
                      <Sparkles />
                    </Button>
                  )}
                </div>
              </FormField>
              <FormField label="Barcode" error={errors.barcode}>
                <Input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="629... (EAN-13)"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Category" error={errors.category}>
                  <Select
                    value={category}
                    onValueChange={(v) => {
                      setCategory(v ?? "");
                      setErrors({ ...errors, category: "" });
                    }}
                  >
                    <SelectTrigger className={cn("w-full", errors.category && "border-red")}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Unit (UOM)" error={errors.unit}>
                  <Select
                    value={unit}
                    onValueChange={(v) => {
                      setUnit(v ?? "");
                      setErrors({ ...errors, unit: "" });
                    }}
                  >
                    <SelectTrigger className={cn("w-full", errors.unit && "border-red")}>
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              <FormField label="Status">
                <Select value={status} onValueChange={(v) => setStatus((v ?? "active") as typeof status)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRODUCT_STATUS_LABELS) as ProductStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {PRODUCT_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox checked={trackBatch} onCheckedChange={(v) => setTrackBatch(!!v)} />
                <span className="text-[12.5px] font-medium text-text-2">Track batches</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox checked={trackExpiry} onCheckedChange={(v) => setTrackExpiry(!!v)} />
                <span className="text-[12.5px] font-medium text-text-2">Track expiry dates (FEFO)</span>
              </label>
            </div>

            <FormField label="Description (optional)" error={errors.description}>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short vendor-facing description"
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </FormField>
          </div>
        </Card>

        <Card className="gap-0 p-0">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <Wallet className="size-4 text-blue" />
            <div className="text-sm font-bold text-text">Pricing</div>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <FormField label="Base cost (per unit)" error={errors.costPrice}>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={costPrice}
                onChange={(e) => {
                  setCostPrice(e.target.value);
                  setErrors({ ...errors, costPrice: "" });
                }}
                aria-invalid={!!errors.costPrice}
                className={cn(errors.costPrice && "border-red")}
              />
            </FormField>
            <FormField label="Base selling price (per unit)" error={errors.sellingPrice}>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={sellingPrice}
                onChange={(e) => {
                  setSellingPrice(e.target.value);
                  setErrors({ ...errors, sellingPrice: "" });
                }}
                aria-invalid={!!errors.sellingPrice}
                className={cn(errors.sellingPrice && "border-red")}
              />
            </FormField>
            <FormField label="Tax rate (%)" error={errors.taxRate}>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.5"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </FormField>
          </div>
          {Number(sellingPrice) > 0 && Number(costPrice) > 0 && (
            <div className="border-t border-border px-5 py-3 text-[11.5px] text-text-3">
              Margin{" "}
              <strong className={cn(margin >= 0 ? "text-green" : "text-red")}>
                {fmtMoney(margin)}
              </strong>{" "}
              ({marginPct >= 0 ? "+" : ""}
              {marginPct}%)
            </div>
          )}
        </Card>

        {!editing && (
          <Card className="gap-0 p-0">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <Boxes className="size-4 text-blue" />
              <div className="text-sm font-bold text-text">Warehouse Initialization</div>
              <span className="ml-auto text-[10.5px] font-bold text-text-4">Opening stock per warehouse</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead className="bg-surface-subtle text-[10.5px] font-bold uppercase tracking-wide text-text-3">
                  <tr>
                    <th className="px-5 py-2.5">Warehouse</th>
                    <th className="px-3 py-2.5 text-right">Opening stock</th>
                    <th className="px-3 py-2.5 text-right">Reorder level</th>
                    <th className="px-3 py-2.5 text-right">Reorder qty</th>
                    <th className="px-5 py-2.5 text-right">Avg cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inits.map((row) => {
                    const wh = warehouses.find((w) => w.id === row.warehouseId);
                    return (
                      <tr key={row.warehouseId} className="hover:bg-surface-subtle">
                        <td className="px-5 py-2.5">
                          <div className="text-[12.5px] font-semibold text-text">{wh?.name ?? "—"}</div>
                          <div className="text-[10.5px] text-text-4">
                            {wh?.code} · {wh?.location}
                            {wh?.isPOSLinked && " · POS"}
                          </div>
                        </td>
                        {(
                          [
                            ["available", "Opening stock"],
                            ["reorderLevel", "Reorder level"],
                            ["reorderQuantity", "Reorder qty"],
                            ["averageCost", "Avg cost"],
                          ] as const
                        ).map(([field, label]) => {
                          const err = errors[`init.${row.warehouseId}.${field}`];
                          return (
                            <td key={field} className="px-3 py-2.5 text-right">
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={row[field]}
                                onChange={(e) => setInit(row.warehouseId, field, e.target.value)}
                                aria-label={`${wh?.name ?? ""} ${label}`}
                                aria-invalid={!!err}
                                className={cn("ml-auto w-28 text-right", err && "border-red")}
                              />
                              {err && <p className="mt-0.5 text-[10px] text-red">{err}</p>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border px-5 py-3">
              <p className="text-[11px] text-text-4">
                Warehouses left at zero opening stock are skipped. You can transfer or adjust stock later from the
                product page.
              </p>
            </div>
          </Card>
        )}

        <div className="flex items-center justify-end gap-2">
          <Link href="/dashboard/products" className="text-[11.5px] text-text-3 underline-offset-2 hover:underline">
            Cancel and go back
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            <Save /> {saving ? "Saving..." : editing ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </div>
    </div>
  );
}