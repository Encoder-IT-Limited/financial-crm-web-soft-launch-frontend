import { PageHeading } from "@/components/shared/page-heading";
import { ProductForm } from "@/app/(tenant)/modules/inventory/components/product-form";

export default function Page() {
  return (
    <div>
      <PageHeading title="Add Product" subtitle="Create a new product in your catalog" />
      <ProductForm />
    </div>
  );
}
