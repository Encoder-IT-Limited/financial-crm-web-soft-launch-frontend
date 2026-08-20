"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeading } from "@/components/shared/page-heading";
import { cn } from "@/lib/utils";
import { useInventoryStore } from "../store/inventory-store";
import { consolidateStock } from "../lib/stock";
import { ProductStatusBadge } from "./product-thumb";
import { StockStatusBadge } from "./stock-status-badge";
import { ProductGeneralTab } from "./product-general-tab";
import { ProductPricingTab } from "./product-pricing-tab";
import { InventoryMatrix } from "./inventory-matrix";
import { BatchTab } from "./batch-tab";

export function ProductDetail({ productId }: { productId: string }) {
  const router = useRouter();
  const product = useInventoryStore((state) => state.products.find((p) => p.id === productId));
  const stockLevels = useInventoryStore((state) => state.stockLevels);
  const [tab, setTab] = useState("general");

  useEffect(() => {
    if (!product) {
      const timer = setTimeout(() => router.replace("/dashboard/products"), 400);
      return () => clearTimeout(timer);
    }
  }, [product, router]);

  if (!product) {
    return (
      <div className="flex h-64 items-center justify-center text-[13px] text-text-4">
        Product not found — redirecting…
      </div>
    );
  }

  const consolidated = consolidateStock(product, stockLevels);

  return (
    <div>
      <PageHeading
        title={product.name}
        subtitle={`SKU ${product.sku} · ${product.category} · sold per ${product.unit}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/products")}>
              <ArrowLeft /> Back
            </Button>
            <Link href={`/dashboard/products/new?edit=${product.id}`}>
              <Button variant="outline" size="sm">
                <PencilLine /> Edit
              </Button>
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ProductStatusBadge status={product.status} />
        <StockStatusBadge status={consolidated.status} />
        {consolidated.inTransit > 0 && (
          <span className="text-[11.5px] text-text-3">
            {consolidated.inTransit} units in transit across warehouses
          </span>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-1">
        <TabsList variant="line" className="w-full justify-start gap-1 border-b border-border pb-0">
          <TabsTrigger value="general" className={cn("rounded-none px-4 py-2", tab === "general" && "after:opacity-100")}>
            General Information
          </TabsTrigger>
          <TabsTrigger value="pricing" className={cn("rounded-none px-4 py-2", tab === "pricing" && "after:opacity-100")}>
            Pricing
          </TabsTrigger>
          <TabsTrigger value="inventory" className={cn("rounded-none px-4 py-2", tab === "inventory" && "after:opacity-100")}>
            Warehouse Inventory
          </TabsTrigger>
          <TabsTrigger value="batches" className={cn("rounded-none px-4 py-2", tab === "batches" && "after:opacity-100")}>
            Batches &amp; Lots
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <ProductGeneralTab product={product} />
        </TabsContent>
        <TabsContent value="pricing" className="mt-4">
          <ProductPricingTab product={product} />
        </TabsContent>
        <TabsContent value="inventory" className="mt-4">
          <InventoryMatrix product={product} />
        </TabsContent>
        <TabsContent value="batches" className="mt-4">
          <BatchTab product={product} />
        </TabsContent>
      </Tabs>
    </div>
  );
}