import { PageHeading } from "@/components/shared/page-heading";
import { Card } from "@/components/ui/card";

const metrics = [
  { label: "Income", value: "AED 84,200", tone: "green" as const },
  { label: "Expenses", value: "AED 31,450", tone: "red" as const },
];

const dues = [
  { label: "Invoices due", value: "AED 22,750", pct: 42, tone: "amber" as const },
  { label: "Overdue", value: "AED 7,250", pct: 14, tone: "red" as const },
  { label: "Bills payable", value: "AED 18,500", pct: 34, tone: "blue" as const },
];

const toneClasses: Record<string, { bg?: string; bar?: string; text: string }> = {
  green: { bg: "bg-green-l", text: "text-green" },
  red: { bg: "bg-red-l", text: "text-red" },
  amber: { text: "text-amber", bar: "bg-amber" },
  blue: { text: "text-blue", bar: "bg-blue" },
};

export default function TenantDashboardPage() {
  return (
    <div>
      <PageHeading title="Dashboard" subtitle="Overview of your organization's finances" />

      <div className="grid grid-cols-2 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={`rounded-[10px] p-3.5 text-center ${toneClasses[m.tone].bg}`}
          >
            <div className={`mb-1.5 text-[11px] font-bold uppercase ${toneClasses[m.tone].text}`}>
              {m.label}
            </div>
            <div className={`text-[22px] font-extrabold ${toneClasses[m.tone].text}`}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <Card className="mt-5">
        <div className="mb-3 text-sm font-bold text-text">Cash flow snapshot</div>
        <div className="flex flex-col gap-4">
          {dues.map((d) => (
            <div key={d.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-text-2">{d.label}</span>
                <span className={`font-semibold ${toneClasses[d.tone].text}`}>{d.value}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-subtle">
                <div
                  className={`h-full rounded-full ${toneClasses[d.tone].bar}`}
                  style={{ width: `${d.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
