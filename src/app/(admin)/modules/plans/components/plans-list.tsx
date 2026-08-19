"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { PencilLine, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MODULE_LABELS } from "@/lib/permissions";
import { fmtMoney } from "@/lib/format";
import type { Plan } from "@/types/plan";
import { planApi } from "../api/plans.service";
import { usePlansStore } from "../store/plans-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

export function PlansList() {
  const router = useRouter();
  const plans = usePlansStore((state) => state.plans);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

  useEffect(() => {
    planApi.list().finally(() => setLoading(false));
  }, []);

  const columns = useMemo<AnyColumnDef<Plan>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Plan",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-bold text-text">{row.original.name}</span>
            {row.original.popular && <Badge tone="purple">Most popular</Badge>}
          </div>
        ),
      },
      {
        id: "monthly",
        accessorFn: (plan: Plan) => plan.priceMonthly,
        header: "Monthly",
        cell: ({ row }) => <span className="text-[13px] text-text">{fmtMoney(row.original.priceMonthly)}/mo</span>,
      },
      {
        id: "yearly",
        accessorFn: (plan: Plan) => plan.priceYearly,
        header: "Yearly",
        cell: ({ row }) => <span className="text-[13px] text-text">{fmtMoney(row.original.priceYearly)}/yr</span>,
      },
      {
        id: "seats",
        header: "Seats",
        cell: ({ row }) => (
          <span className="text-[12.5px] text-text-2">
            {row.original.baseSeats} base · {fmtMoney(row.original.additionalSeatPrice)}/extra
          </span>
        ),
      },
      {
        id: "trial",
        accessorFn: (plan: Plan) => plan.trialDays,
        header: "Trial",
        cell: ({ row }) => <span className="text-[12.5px] text-text-2">{row.original.trialDays} days</span>,
      },
      {
        id: "modules",
        header: "Modules",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-[12.5px] text-text-3">
            {row.original.modules.length} — {row.original.modules.map((m) => MODULE_LABELS[m]).join(", ")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${row.original.name}`}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/admin/plans/${row.original.id}`);
              }}
            >
              <PencilLine />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${row.original.name}`}
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(row.original);
              }}
            >
              <Trash2 className="text-red" />
            </Button>
          </div>
        ),
      },
    ],
    [router]
  );

  return (
    <div>
      <PageHeading
        title="Plans & Pricing"
        subtitle="Configure subscription tiers, seat pricing, and module access"
        actions={
          <Link href="/admin/plans/new">
            <Button size="sm">
              <Plus /> New plan
            </Button>
          </Link>
        }
      />

      <FilterableTable
        columns={columns}
        data={plans}
        loading={loading}
        getRowId={(plan) => plan.id}
        onRowClick={(plan) => router.push(`/admin/plans/${plan.id}`)}
        rowClassName="cursor-pointer"
        emptyState="No plans yet — create one to get started."
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name ?? "plan"}?`}
        description="Tenants already on this plan keep their current terms, but it will no longer be offered on the pricing page or at signup. This can't be undone."
        confirmLabel="Delete plan"
        destructive
        onConfirm={async () => {
          if (!deleteTarget) return;
          await planApi.delete(deleteTarget.id);
        }}
        successMessage={`${deleteTarget?.name ?? "Plan"} deleted`}
      />
    </div>
  );
}
