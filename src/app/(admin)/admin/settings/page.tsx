import { PageHeading } from "@/components/shared/page-heading";
import { SettingsTabs } from "@/app/(admin)/modules/settings/components/settings-tabs";

export default function Page() {
  return (
    <div>
      <PageHeading title="Settings" subtitle="General platform settings, legal content, and social links" />
      <SettingsTabs />
    </div>
  );
}
