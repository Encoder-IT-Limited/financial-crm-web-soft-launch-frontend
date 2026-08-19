import { PageHeading } from "@/components/shared/page-heading";
import { PlanForm } from "../../../modules/plans/components/plan-form";

export default async function Page({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;

  return (
    <div>
      <PageHeading title="Edit plan" subtitle="Update pricing, seats, and module access" />
      <PlanForm mode="edit" planId={planId} />
    </div>
  );
}
