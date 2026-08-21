"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, ChevronDown, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageHeading } from "@/components/shared/page-heading";
import type { StockMovementRow } from "../mock-data";

const defaultRange = {
  from: new Date(2024, 4, 12),
  to: new Date(2024, 4, 18),
};

function formatRangeLabel(range: DateRange | undefined) {
  if (!range?.from) return "Select date range";
  if (!range.to) return format(range.from, "MMM d, yyyy");
  return `${format(range.from, "MMM d, yyyy")} - ${format(range.to, "MMM d, yyyy")}`;
}

function exportMovementsCsv(movements: StockMovementRow[], range: DateRange | undefined) {
  const header = ["Date", "Type", "Reference", "Product", "Warehouse", "In", "Out", "Balance"];
  const rows = movements.map((m) => [
    m.date,
    m.type,
    m.reference,
    m.product,
    m.warehouse,
    m.inQty ?? "",
    m.outQty ?? "",
    m.balance,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  const suffix =
    range?.from && range?.to
      ? `${format(range.from, "yyyy-MM-dd")}_${format(range.to, "yyyy-MM-dd")}`
      : "all-time";
  anchor.download = `stock-movements_${suffix}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DashboardHeader({ movements }: { movements: StockMovementRow[] }) {
  const [range, setRange] = useState<DateRange | undefined>(defaultRange);

  function handleExport() {
    exportMovementsCsv(movements, range);
    toast.success("Report exported", {
      description: "Stock movements report downloaded as CSV.",
    });
  }

  return (
    <PageHeading
      title="Inventory Dashboard"
      actions={
        <>
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" className="max-w-[220px] sm:max-w-none">
                  <CalendarIcon data-icon="inline-start" />
                  <span className="truncate">{formatRangeLabel(range)}</span>
                  <ChevronDown data-icon="inline-end" className="text-text-3" />
                </Button>
              }
            />
            <PopoverContent align="end" className="w-auto p-0">
              <Calendar
                mode="range"
                numberOfMonths={1}
                selected={range}
                onSelect={(selected) => setRange(selected)}
              />
            </PopoverContent>
          </Popover>

          <Button onClick={handleExport}>
            <Download data-icon="inline-start" />
            Export Report
          </Button>
        </>
      }
    />
  );
}
