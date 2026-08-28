"use client";

import { LegalPage } from "../components/legal-page";
import { usePublicSettings } from "../modules/settings/hooks/use-public-settings";

export function TermsOfServiceContent() {
  const { data } = usePublicSettings();
  return (
    <LegalPage title="Terms of Service" lastUpdated={data?.termsLastUpdated ?? ""}>
      <div dangerouslySetInnerHTML={{ __html: data?.termsBody ?? "" }} />
    </LegalPage>
  );
}
