"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeading } from "@/components/shared/page-heading";
import { toast } from "@/lib/toast";
import { GeneratedReportsTable } from "./generated-reports-table";
import { InventoryTurnoverChart } from "./inventory-turnover-chart";
import { QuickReportGrid } from "./quick-report-grid";
import { ReportsToolbar, type ReportFilters } from "./reports-toolbar";
import { TopProductsChart } from "./top-products-chart";
import {
  generatedReports as reportsSeed,
  type GeneratedReport,
  type QuickReport,
} from "../mock-data";

const INITIAL_FILTERS: ReportFilters = {
  search: "",
  category: "all",
  range: "all",
};

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

const RANGE_CUTOFF_ISO = {
  "30": isoDaysAgo(30),
  "90": isoDaysAgo(90),
  "180": isoDaysAgo(180),
};

function simulatedFileSize(report: QuickReport): string {
  const sizeMb = 0.8 + (report.title.length % 5) * 0.4;
  return `${sizeMb.toFixed(1)} MB`;
}

export function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>(INITIAL_FILTERS);
  const [reports, setReports] = useState<GeneratedReport[]>(reportsSeed);
  const [deleteTarget, setDeleteTarget] = useState<GeneratedReport | null>(null);
  const pendingTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    const timers = pendingTimers.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    const cutoff =
      filters.range === "all" ? null : RANGE_CUTOFF_ISO[filters.range];

    return reports.filter((report) => {
      if (filters.category !== "all" && report.category !== filters.category) return false;
      if (cutoff && report.generatedAt.slice(0, 10) < cutoff) return false;
      if (needle) {
        const haystack = `${report.name} ${report.category}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [reports, filters]);

  function handleGenerate(report: QuickReport) {
    const now = new Date();
    const stamp = now.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    const id = `rep-${now.getTime().toString(36)}`;
    const row: GeneratedReport = {
      id,
      name: `${report.title} - ${stamp}`,
      category: report.category,
      generatedAt: now.toISOString(),
      format: "pdf",
      fileSize: "—",
      status: "processing",
    };
    setReports((prev) => [row, ...prev]);
    toast.success(`${report.title} generation started`, {
      description: "It will appear as Ready below in a moment.",
    });
    pendingTimers.current.push(
      setTimeout(() => {
        setReports((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, status: "ready" as const, fileSize: simulatedFileSize(report) }
              : r
          )
        );
      }, 2500)
    );
  }

  function handleSchedule() {
    toast.info("Report scheduling will be available once the reports service is connected");
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setReports((prev) => prev.filter((r) => r.id !== deleteTarget.id));
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Reports"
        subtitle="Generate, view, and download detailed inventory reports"
        actions={
          <Button onClick={handleSchedule}>
            <Plus data-icon="inline-start" />
            Schedule Report
          </Button>
        }
      />

      <div>
        <h2 className="text-[15px] font-bold text-text min-[1440px]:text-base">Quick Reports</h2>
        <p className="mt-0.5 text-[12.5px] text-text-3 min-[1440px]:text-[13.5px]">
          Generate a fresh snapshot with one click — it lands in the list below.
        </p>
        <div className="mt-4">
          <QuickReportGrid onGenerate={handleGenerate} />
        </div>
      </div>

      <div>
        <h2 className="text-[15px] font-bold text-text min-[1440px]:text-base">
          Analytics Overview
        </h2>
        <p className="mt-0.5 text-[12.5px] text-text-3 min-[1440px]:text-[13.5px]">
          How stock is performing across the business right now.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <InventoryTurnoverChart />
          <TopProductsChart />
        </div>
      </div>

      <Card className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="text-[15px] font-bold text-text min-[1440px]:text-base">
            Generated Reports
          </h2>
          <p className="mt-0.5 text-[12.5px] text-text-3 min-[1440px]:text-[13.5px]">
            Previously generated and scheduled reports — search and filters apply here.
          </p>
        </div>

        <ReportsToolbar filters={filters} onChange={setFilters} />

        <GeneratedReportsTable rows={filtered} onDelete={setDeleteTarget} />
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete report"
        description={`This will permanently remove "${deleteTarget?.name ?? ""}" from your report history.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
        successMessage={`${deleteTarget?.name ?? "Report"} deleted`}
      />
    </div>
  );
}
