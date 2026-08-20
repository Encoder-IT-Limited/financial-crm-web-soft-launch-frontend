import { Suspense } from "react";
import { TenantsList } from "../../modules/tenants/components/tenants-list";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TenantsList />
    </Suspense>
  );
}
