import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { SettingsSection } from "./settings-section";
import type { SocialLinks } from "../types";

export function SocialLinksTab({
  value,
  errors,
  onChange,
}: {
  value: SocialLinks;
  errors: Record<string, string>;
  onChange: (patch: Partial<SocialLinks>) => void;
}) {
  return (
    <SettingsSection title="Social links" description="Profile links for the platform's social accounts.">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="LinkedIn" error={errors.linkedin}>
          <Input
            value={value.linkedin}
            placeholder="https://linkedin.com/company/..."
            onChange={(e) => onChange({ linkedin: e.target.value })}
          />
        </FormField>
        <FormField label="X / Twitter" error={errors.twitter}>
          <Input
            value={value.twitter}
            placeholder="https://x.com/..."
            onChange={(e) => onChange({ twitter: e.target.value })}
          />
        </FormField>
        <FormField label="Instagram" error={errors.instagram}>
          <Input
            value={value.instagram}
            placeholder="https://instagram.com/..."
            onChange={(e) => onChange({ instagram: e.target.value })}
          />
        </FormField>
      </div>
    </SettingsSection>
  );
}
