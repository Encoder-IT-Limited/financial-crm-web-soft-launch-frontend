import { ProductDetailsPage } from "@/app/(tenant)/modules/inventory/components/product-details-page";

export default async function Page({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return <ProductDetailsPage productId={productId} />;
}
