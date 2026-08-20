import { SettingsSection } from "./settings-section";
import { RichTextEditor } from "./rich-text-editor";
import type { LegalSettings } from "../types";

export function LegalTab({
  value,
  errors,
  onChange,
}: {
  value: LegalSettings;
  errors: Record<string, string>;
  onChange: (patch: Partial<LegalSettings>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <SettingsSection title="Privacy policy" description="Rendered at the public /privacy page.">
        <RichTextEditor value={value.privacyBody} onChange={(html) => onChange({ privacyBody: html })} />
        {errors.privacyBody && <p className="text-[10.5px] text-red">{errors.privacyBody}</p>}
      </SettingsSection>

      <SettingsSection title="Terms of service" description="Rendered at the public /terms page.">
        <RichTextEditor value={value.termsBody} onChange={(html) => onChange({ termsBody: html })} />
        {errors.termsBody && <p className="text-[10.5px] text-red">{errors.termsBody}</p>}
      </SettingsSection>
    </div>
  );
}
