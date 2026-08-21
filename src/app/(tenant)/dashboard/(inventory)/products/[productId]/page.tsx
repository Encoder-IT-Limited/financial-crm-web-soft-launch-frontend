// import { ProductDetail } from "../../../modules/inventory/components/product-detail";

export default async function Page({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  // return <ProductDetail productId={productId} />;
  return <div className="">Details page</div>;
}
