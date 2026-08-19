import { PageHeading } from "@/components/shared/page-heading";
import { PlanForm } from "../../../modules/plans/components/plan-form";

export default function Page() {
  return (
    <div>
      <PageHeading title="Create plan" subtitle="Define pricing, seats, and module access for a new tier" />
      <PlanForm mode="create" />
    </div>
  );
}
