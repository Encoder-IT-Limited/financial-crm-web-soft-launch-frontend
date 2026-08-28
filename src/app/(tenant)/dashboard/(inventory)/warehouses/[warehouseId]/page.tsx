import { WarehouseDetailsPage } from "@/app/(tenant)/modules/inventory/components/warehouse-details-page";

export default async function Page({ params }: { params: Promise<{ warehouseId: string }> }) {
  const { warehouseId } = await params;
  return <WarehouseDetailsPage warehouseId={warehouseId} />;
}
