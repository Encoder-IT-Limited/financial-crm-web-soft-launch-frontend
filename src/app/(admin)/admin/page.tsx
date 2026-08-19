import { PageHeading } from "@/components/shared/PageHeading";
import { Card } from "@/components/ui/card";

const metrics = [
  { label: "Active tenants", value: "128" },
  { label: "MRR", value: "AED 64,300" },
  { label: "Open support tickets", value: "6" },
  { label: "Accounts expiring (7d)", value: "3" },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <PageHeading title="Platform overview" subtitle="MRM Super Admin · all tenant accounts" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="p-4">
            <div className="mb-2 text-[11px] font-semibold uppercase text-text-4">{m.label}</div>
            <div className="text-xl font-extrabold text-text">{m.value}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
