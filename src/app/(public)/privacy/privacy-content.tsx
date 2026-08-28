"use client";

import { LegalPage } from "../components/legal-page";
import { usePublicSettings } from "../modules/settings/hooks/use-public-settings";

export function PrivacyPolicyContent() {
  const { data } = usePublicSettings();
  return (
    <LegalPage title="Privacy Policy" lastUpdated={data?.privacyLastUpdated ?? ""}>
      <div dangerouslySetInnerHTML={{ __html: data?.privacyBody ?? "" }} />
    </LegalPage>
  );
}
