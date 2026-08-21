import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/shared/page-heading";
import { SalesDashboard } from "../modules/billing/components/sales-dashboard";

export default function TenantDashboardPage() {
  return (
    <div>
      <PageHeading
        title="Dashboard"
        subtitle="Sales & receivables overview"
        actions={
          <Link href="/dashboard/invoices/new">
            <Button size="sm">
              <Plus /> New Invoice
            </Button>
          </Link>
        }
      />
      <div className="mt-4">
        <SalesDashboard />
      </div>
    </div>
  );
}
