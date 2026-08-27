"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ApiError } from "@/lib/api/errors";
import { fmtMoney } from "@/lib/format";
import { toast } from "@/lib/toast";
import { useDeleteProduct, useProduct, useStock, useUpdateProduct } from "../hooks/use-inventory";
import { ProductEditDialog } from "./product-edit-dialog";
import { ProductThumbnail, STOCK_TONE_LABEL, getStockTone } from "./product-thumbnail";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="text-[12.5px] text-text-3">{label}</span>
      <span className="text-right text-[12.5px] font-medium text-text">{value}</span>
    </div>
  );
}

export function ProductDetailsPage({ productId }: { productId: string }) {
  const router = useRouter();
  const { data: product, isLoading, isError } = useProduct(productId);
  const { data: stock = [] } = useStock();
  const damagedQuantity = stock
    .filter((row) => row.productId === productId)
    .reduce((sum, row) => sum + row.damagedQuantity, 0);
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div>
        <Link href="/dashboard/products" className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-text-3">
          <ArrowLeft className="size-3.5" />
          Back to Products
        </Link>
        <p className="text-sm text-text-2">Product not found.</p>
      </div>
    );
  }

  const tone = getStockTone(product.stock, product.minimumStock);

  return (
    <div>
      <Link href="/dashboard/products" className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-text-3 hover:text-blue">
        <ArrowLeft className="size-3.5" />
        Back to Products
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <ProductThumbnail product={product} className="size-12 rounded-xl text-sm" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold text-text">{product.name}</h1>
          <p className="mt-0.5 text-[12.5px] text-text-3">SKU {product.sku}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={product.status === "active" ? "green" : "neutral"}>
            {product.status === "active" ? "Active" : "Inactive"}
          </Badge>
          <Badge tone={tone}>{STOCK_TONE_LABEL[tone]}</Badge>
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
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
          <div className="text-[11.5px] text-text-3">Unit Price</div>
          <div className="mt-1 text-lg font-extrabold">{fmtMoney(product.price)}</div>
        </Card>
        <Card className="gap-0 p-4">
          <div className="text-[11.5px] text-text-3">On hand</div>
          <div className="mt-1 text-lg font-extrabold">{product.stock}</div>
        </Card>
        <Card className="gap-0 p-4">
          <div className="text-[11.5px] text-text-3">Damaged</div>
          <div className={damagedQuantity > 0 ? "mt-1 text-lg font-extrabold text-amber" : "mt-1 text-lg font-extrabold"}>{damagedQuantity}</div>
        </Card>
        <Card className="gap-0 p-4">
          <div className="text-[11.5px] text-text-3">Minimum stock</div>
          <div className="mt-1 text-lg font-extrabold">{product.minimumStock}</div>
        </Card>
        <Card className="gap-0 p-4">
          <div className="text-[11.5px] text-text-3">Maximum stock</div>
          <div className="mt-1 text-lg font-extrabold">{product.maximumStock}</div>
        </Card>
      </div>

      <Card className="mt-5 max-w-xl gap-0 p-5">
        <DetailRow label="Category" value={product.category} />
        <DetailRow label="Subcategory" value={product.subcategory || "—"} />
        <DetailRow label="Unit" value={product.unit} />
        <DetailRow label="Cost price" value={fmtMoney(product.costPrice)} />
        <DetailRow label="Reorder level" value={product.reorderLevel} />
        <DetailRow label="Tax rate" value={`${product.taxRate ?? 0}%`} />
        <DetailRow label="Barcode" value={product.barcode || "—"} />
        <DetailRow label="Batch tracking" value={product.trackBatch ? "Yes" : "No"} />
        <DetailRow label="Description" value={product.description || "—"} />
      </Card>

      <ProductEditDialog product={product} open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete product?"
        description="This permanently removes the product if it has no stock history. Otherwise deactivate it instead."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          try {
            await deleteProduct.mutateAsync(product.id);
            toast.success("Product deleted");
            router.push("/dashboard/products");
          } catch (err) {
            if (err instanceof ApiError && err.code === "PRODUCT_IN_USE") {
              await updateProduct.mutateAsync({
                id: product.id,
                input: { status: "INACTIVE" },
              });
              toast.success("Product has history — deactivated instead");
              return;
            }
            throw err;
          }
        }}
      />
    </div>
  );
}
