"use client";

import { useState } from "react";
import { Settings2, ScrollText, Share2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { PLATFORM_SETTINGS } from "@/config/platform-settings";
import { generalSettingsSchema, legalSchema, socialLinksSchema } from "../schemas";
import type { GeneralSettings, LegalSettings, PlatformSettings, SocialLinks } from "../types";
import { GeneralSettingsTab } from "./general-settings-tab";
import { LegalTab } from "./legal-tab";
import { SocialLinksTab } from "./social-links-tab";

const NAV_ITEMS = [
  { value: "general", label: "General settings", icon: Settings2 },
  { value: "legal", label: "Legal & policies", icon: ScrollText },
  { value: "social", label: "Social links", icon: Share2 },
];

export function SettingsTabs() {
  const [settings, setSettings] = useState<PlatformSettings>(PLATFORM_SETTINGS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function patchGeneral(patch: Partial<GeneralSettings>) {
    setSettings((prev) => ({ ...prev, general: { ...prev.general, ...patch } }));
  }
  function patchLegal(patch: Partial<LegalSettings>) {
    setSettings((prev) => ({ ...prev, legal: { ...prev.legal, ...patch } }));
  }
  function patchSocialLinks(patch: Partial<SocialLinks>) {
    setSettings((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, ...patch } }));
  }

  function handleSave() {
    const generalResult = generalSettingsSchema.safeParse(settings.general);
    const legalResult = legalSchema.safeParse(settings.legal);
    const socialResult = socialLinksSchema.safeParse(settings.socialLinks);

    const nextErrors: Record<string, string> = {};
    for (const result of [generalResult, legalResult, socialResult]) {
      if (!result.success) {
        for (const issue of result.error.issues) nextErrors[issue.path.join(".")] = issue.message;
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    // TEMPORARY: no settings backend yet — nothing to persist beyond this
    // page's local state (see src/config/platform-settings.ts).
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings saved (not yet connected to a backend — changes reset on refresh)");
    }, 400);
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="general" orientation="vertical" className="w-full flex-col gap-0 lg:flex-row">
        <Card className="flex w-full flex-col gap-6 overflow-hidden p-0 lg:flex-row">
          <TabsList className="h-fit w-full shrink-0 flex-row gap-1 overflow-x-auto border-b border-border bg-transparent p-2.5 lg:w-60 lg:flex-col lg:overflow-visible lg:border-r lg:border-b-0">
            {NAV_ITEMS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="h-auto w-full shrink-0 justify-start gap-2.5 rounded-lg border-y-0 border-r-0 border-l-[3px] border-transparent px-3 py-2.5 text-[13px] font-medium text-text-3 !shadow-none data-active:!border-l-blue data-active:!bg-blue-l data-active:!font-semibold data-active:!text-blue"
              >
                <Icon className="size-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 p-5 sm:p-6">
            <TabsContent value="general">
              <GeneralSettingsTab value={settings.general} errors={errors} onChange={patchGeneral} />
            </TabsContent>
            <TabsContent value="legal">
              <LegalTab value={settings.legal} errors={errors} onChange={patchLegal} />
            </TabsContent>
            <TabsContent value="social">
              <SocialLinksTab value={settings.socialLinks} errors={errors} onChange={patchSocialLinks} />
            </TabsContent>
          </div>
        </Card>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
