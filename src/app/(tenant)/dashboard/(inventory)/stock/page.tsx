import { PageHeading } from "@/components/shared/page-heading";
import { StockTabs } from "./components/stock-tabs";

export default function Page() {
  return (
    <div>
      <PageHeading
        title="Stock"
        subtitle="Track stock movements and inter-warehouse transfers"
      />
      <StockTabs />
    </div>
  );
}
