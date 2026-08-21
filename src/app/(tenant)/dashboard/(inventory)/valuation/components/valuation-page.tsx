"use client";

import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/shared/page-heading";
import { downloadCsv } from "@/lib/csv";
import { fmtMoney } from "@/lib/format";
import { toast } from "@/lib/toast";
import { CategoryValueChart } from "./category-value-chart";
import { ValuationSummaryCards } from "./valuation-summary-cards";
import { ValuationTable } from "./valuation-table";
import {
  ValuationToolbar,
  type ValuationFilters,
} from "./valuation-toolbar";
import { ValuationTrendChart } from "./valuation-trend-chart";
import { WarehouseValueChart } from "./warehouse-value-chart";
import {
  VALUATION_METHOD_LABEL,
  unitCostAt,
  valuationCategories,
  valuationRows,
  valuationWarehouses,
  type ValuationRow,
} from "../mock-data";

const INITIAL_FILTERS: ValuationFilters = {
  search: "",
  warehouse: "all",
  category: "all",
  method: "fifo",
  range: "all",
};

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

const RANGE_CUTOFF_ISO: Record<Exclude<ValuationFilters["range"], "all">, string> = {
  "30": isoDaysAgo(30),
  "90": isoDaysAgo(90),
  "180": isoDaysAgo(180),
};

function exportValuationCsv(rows: ValuationRow[], method: ValuationFilters["method"], scope: string) {
  const basis = VALUATION_METHOD_LABEL[method];
  const header = [
    "Product",
    "SKU",
    "Category",
    "Warehouse",
    "Qty In Stock",
    `Unit Cost ${basis} (AED)`,
    "Unit Retail Price (AED)",
    "Total Cost Value (AED)",
    "Total Retail Value (AED)",
    "Profit Potential (AED)",
  ];
  const body = rows.map((row) => [
    row.name,
    row.sku,
    row.category,
    row.warehouse,
    row.qty,
    unitCostAt(row, method),
    row.unitRetail,
    row.qty * unitCostAt(row, method),
    row.qty * row.unitRetail,
    row.qty * (row.unitRetail - unitCostAt(row, method)),
  ]);

  downloadCsv(`inventory_valuation_${new Date().toISOString().slice(0, 10)}.csv`, header, body);
  toast.success("Valuation exported", {
    description: `${rows.length} line${rows.length === 1 ? "" : "s"} (${scope}) downloaded as CSV.`,
  });
}

export function ValuationPage() {
  const [filters, setFilters] = useState<ValuationFilters>(INITIAL_FILTERS);

  const warehouses = useMemo(() => valuationWarehouses(valuationRows), []);
  const categories = useMemo(() => valuationCategories(valuationRows), []);

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    const cutoff =
      filters.range === "all" ? null : RANGE_CUTOFF_ISO[filters.range];

    return valuationRows.filter((row) => {
      if (filters.warehouse !== "all" && row.warehouse !== filters.warehouse) return false;
      if (filters.category !== "all" && row.category !== filters.category) return false;
      if (cutoff && row.asOf < cutoff) return false;
      if (needle) {
        const haystack = `${row.name} ${row.sku} ${row.category}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [filters]);

  const totals = useMemo(() => {
    let inventoryValue = 0;
    let totalCost = 0;
    let totalRetail = 0;
    for (const row of filtered) {
      inventoryValue += row.qty * row.unitCostWac;
      totalCost += row.qty * unitCostAt(row, filters.method);
      totalRetail += row.qty * row.unitRetail;
    }
    const profitMargin =
      totalRetail > 0 ? ((totalRetail - totalCost) / totalRetail) * 100 : 0;
    return {
      inventoryValue,
      totalCost,
      totalRetail,
      profitMargin: Math.round(profitMargin * 10) / 10,
    };
  }, [filtered, filters.method]);

  function handleExport() {
    exportValuationCsv(filtered, filters.method, "current view");
  }

  function handleExportSelected(rows: ValuationRow[]) {
    exportValuationCsv(rows, filters.method, "selection");
  }

  function handleGenerateReport() {
    toast.success("Valuation report generated", {
      description: `${VALUATION_METHOD_LABEL[filters.method]} basis · ${filtered.length} stock lines · ${fmtMoney(totals.totalRetail)} retail value.`,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Valuation"
        subtitle="Analyze and track the financial value of your inventory"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download data-icon="inline-start" />
              Export
            </Button>
            <Button onClick={handleGenerateReport}>
              <FileText data-icon="inline-start" />
              Generate Report
            </Button>
          </>
        }
      />

      <ValuationSummaryCards
        inventoryValue={totals.inventoryValue}
        totalCost={totals.totalCost}
        totalRetail={totals.totalRetail}
        profitMargin={totals.profitMargin}
        costBasisLabel={VALUATION_METHOD_LABEL[filters.method]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoryValueChart rows={filtered} />
        <WarehouseValueChart rows={filtered} />
        <ValuationTrendChart />
      </div>

      <Card className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="text-[15px] font-bold text-text min-[1440px]:text-base">
            Valuation Details
          </h2>
          <p className="mt-0.5 text-[12.5px] text-text-3 min-[1440px]:text-[13.5px]">
            Stock-on-hand financials per product and warehouse — totals follow the filters
            and the selected {VALUATION_METHOD_LABEL[filters.method]} cost basis.
          </p>
        </div>

        <ValuationToolbar
          filters={filters}
          onChange={setFilters}
          warehouses={warehouses}
          categories={categories}
        />

        <ValuationTable
          rows={filtered}
          method={filters.method}
          onExportSelected={handleExportSelected}
        />
      </Card>
    </div>
  );
}
