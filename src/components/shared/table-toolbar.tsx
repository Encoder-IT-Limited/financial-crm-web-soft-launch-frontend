"use client";

import { useId, useState, type ReactNode } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type TableColumnOption = {
  id: string;
  label: string;
  visible: boolean;
};

type TableToolbarProps = {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  /** Filter controls — shown inline at `lg:` and up, again inside the mobile sheet below it */
  children?: ReactNode;
  onClearFilters?: () => void;
  /** Hideable columns, shown as checkboxes inside the mobile filters sheet */
  columnOptions?: TableColumnOption[];
  onToggleColumn?: (id: string, visible: boolean) => void;
  className?: string;
};

export function TableToolbar({
  search,
  children,
  onClearFilters,
  columnOptions,
  onToggleColumn,
  className,
}: TableToolbarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const filterHeadingId = useId();
  const columnsHeadingId = useId();
  const hasFilters = Boolean(children);
  const hasColumns = Boolean(columnOptions && columnOptions.length > 0);

  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {search && (
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-text-4" />
          <Input
            type="text"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder ?? "Search..."}
            className="h-9 border-border pl-9 text-[12.5px] min-[1440px]:text-[13.5px]"
          />
        </div>
      )}

      {children && <div className="hidden flex-wrap items-center gap-2.5 lg:flex">{children}</div>}

      {(hasFilters || hasColumns) && (
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[12.5px] font-medium text-text-2 transition-colors hover:bg-surface-subtle lg:hidden"
        >
          <SlidersHorizontal className="size-3.5" />
          Filters
        </button>
      )}

      {onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="hidden h-9 rounded-lg px-3 text-[12.5px] font-medium text-text-3 transition-colors hover:text-blue lg:block"
        >
          Clear filters
        </button>
      )}

      {(hasFilters || hasColumns) && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4">
              {hasFilters && (
                <div className="flex flex-col gap-3">
                  <span id={filterHeadingId} className="text-[10px] font-bold tracking-wide text-text-4 uppercase">
                    Filter by
                  </span>
                  <div
                    role="group"
                    aria-labelledby={filterHeadingId}
                    className="flex flex-col items-stretch gap-2.5 [&>*]:w-full"
                  >
                    {children}
                  </div>
                </div>
              )}

              {hasColumns && (
                <div className="flex flex-col gap-3">
                  <span id={columnsHeadingId} className="text-[10px] font-bold tracking-wide text-text-4 uppercase">
                    Columns
                  </span>
                  <div role="group" aria-labelledby={columnsHeadingId} className="flex flex-col gap-3">
                    {columnOptions!.map((column) => (
                      <label key={column.id} className="flex items-center gap-2.5">
                        <Checkbox
                          checked={column.visible}
                          onCheckedChange={(checked) => onToggleColumn?.(column.id, checked === true)}
                        />
                        <span className="text-[12.5px] text-text-2">{column.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <SheetFooter className="flex-row gap-2">
              {onClearFilters && (
                <Button type="button" variant="outline" className="flex-1" onClick={onClearFilters}>
                  Clear all
                </Button>
              )}
              <SheetClose render={<Button type="button" className="flex-1" />}>Done</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
