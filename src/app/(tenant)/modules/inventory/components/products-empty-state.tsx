import Link from "next/link";
import { PackageSearch, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProductsEmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-border px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-surface-subtle text-text-4">
        <PackageSearch className="size-6" />
      </span>
      <div>
        <p className="text-sm font-bold text-text">No products found</p>
        <p className="mt-1 max-w-xs text-[12.5px] text-text-3">
          {hasFilters
            ? "No products match your current search or filters."
            : "Your catalog is empty. Add your first product to get started."}
        </p>
      </div>
      <div className="mt-1 flex items-center gap-2">
        {hasFilters && (
          <Button variant="outline" size="sm" className="h-9" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
        <Button size="sm" className="h-9" render={<Link href="/dashboard/products/new" />}>
          <Plus data-icon="inline-start" />
          Add your first product
        </Button>
      </div>
    </div>
  );
}
