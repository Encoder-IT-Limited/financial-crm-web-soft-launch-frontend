import { notFound } from "next/navigation";
import { products } from "../mock-data";
import { ProductDetails } from "../components/product-details";

export default async function Page({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = products.find((p) => p.id === productId);

  if (!product) notFound();

  return <ProductDetails product={product} />;
}
