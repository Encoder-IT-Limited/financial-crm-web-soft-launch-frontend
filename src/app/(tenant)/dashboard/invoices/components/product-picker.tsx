"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { productLookupApi, stockAt, type ProductLookupItem } from "../api/product-lookup.service";

type Rect = { top: number; left: number; width: number };

/** Search-as-you-type product picker for an invoice line. The results
 * dropdown is portaled to `document.body` and positioned from the input's
 * viewport rect — the line-items table sits inside an `overflow-x-auto`
 * wrapper, which (per a standard CSS quirk) clips vertical overflow too
 * once any axis is scrollable, so a plain absolutely-positioned dropdown
 * gets cut off instead of floating above the table. Portaling escapes that
 * clipping entirely. Not the Popover primitive, to sidestep Base UI's
 * trigger/render-target semantics for a plain text input. Disabled until a
 * warehouse is chosen, since stock is only meaningful per warehouse. */
export function ProductPicker({
  warehouseId,
  value,
  onSelect,
  placeholder = "Search product or SKU...",
}: {
  warehouseId: string | undefined;
  value: string;
  onSelect: (item: ProductLookupItem) => void;
  placeholder?: string;
}) {
  const { data: items = [] } = useQuery({ queryKey: ["product-lookup-items"], queryFn: productLookupApi.listProducts });
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle
      ? items.filter((item) => item.name.toLowerCase().includes(needle) || item.sku.toLowerCase().includes(needle))
      : items;
    return matches.slice(0, 8);
  }, [items, query]);

  function openDropdown() {
    const el = wrapperRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setRect({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen(true);
  }

  // Anchored by viewport coordinates, not a live-following portal — closing
  // on scroll/resize is simpler and standard combobox behavior, rather than
  // recalculating position on every scroll tick. Scroll events inside the
  // dropdown's own results list are excluded — a capture-phase window
  // listener otherwise fires for that scroll too (it doesn't need to
  // bubble to be caught on the way down), closing the dropdown the instant
  // you try to scroll it.
  useEffect(() => {
    if (!open) return;
    function close(e: Event) {
      if (e.target instanceof Node && dropdownRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          openDropdown();
        }}
        onFocus={openDropdown}
        onBlur={() => setOpen(false)}
        disabled={!warehouseId}
        placeholder={warehouseId ? placeholder : "Select a warehouse first"}
        aria-label="Search product"
      />

      {open &&
        warehouseId &&
        rect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ position: "fixed", top: rect.top, left: rect.left, width: Math.max(rect.width, 260) }}
            className="z-50 max-h-64 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-lg"
          >
            {results.length === 0 ? (
              <div className="px-2.5 py-2 text-[12px] text-text-4">No products found.</div>
            ) : (
              results.map((item) => {
                const stock = stockAt(item, warehouseId);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onSelect(item);
                      setQuery(item.name);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left hover:bg-surface-subtle"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[12.5px] font-medium text-text">{item.name}</div>
                      <div className="text-[10.5px] text-text-4">
                        {item.sku} · {fmtMoney(item.price)}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-[11px] font-semibold",
                        stock <= 0 ? "text-red" : stock <= 5 ? "text-amber" : "text-text-3"
                      )}
                    >
                      {stock} in stock
                    </span>
                  </button>
                );
              })
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
