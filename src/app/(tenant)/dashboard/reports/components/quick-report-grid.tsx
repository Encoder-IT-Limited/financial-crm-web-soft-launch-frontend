"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  QUICK_REPORTS,
  QUICK_REPORT_TONE_CLASS,
  type QuickReport,
} from "../mock-data";

interface QuickReportGridProps {
  onGenerate: (report: QuickReport) => void;
}

export function QuickReportGrid({ onGenerate }: QuickReportGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {QUICK_REPORTS.map((report) => {
        const Icon = report.icon;
        return (
          <Card
            key={report.id}
            className="flex flex-col gap-3 p-5 transition-shadow duration-150 hover:shadow-md"
          >
            <span
              className={cn(
                "grid size-9 place-items-center rounded-lg",
                QUICK_REPORT_TONE_CLASS[report.tone]
              )}
            >
              <Icon className="size-[18px]" />
            </span>

            <h3 className="text-[14px] font-bold text-text min-[1440px]:text-[15px]">
              {report.title}
            </h3>
            <p className="text-[12.5px] leading-relaxed text-text-3">{report.description}</p>

            <div className="mt-auto flex items-center justify-between gap-2 pt-1">
              <span className="truncate text-[11px] font-semibold text-text-4">
                {report.category}
              </span>
              <Button variant="outline" size="sm" onClick={() => onGenerate(report)}>
                Generate
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
