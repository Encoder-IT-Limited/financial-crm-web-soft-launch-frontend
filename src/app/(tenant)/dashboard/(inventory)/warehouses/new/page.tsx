import { PageHeading } from "@/components/shared/page-heading";
import { WarehouseForm } from "@/app/(tenant)/modules/inventory/components/warehouse-form";

export default function Page() {
  return (
    <div>
      <PageHeading title="Add Warehouse" subtitle="Create a new warehouse location" />
      <WarehouseForm />
    </div>
  );
}
