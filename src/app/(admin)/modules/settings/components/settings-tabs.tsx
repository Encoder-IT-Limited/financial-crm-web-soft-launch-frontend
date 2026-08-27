"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings2, ScrollText, Share2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { settingsApi } from "../api/settings.service";
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

const settingsKeys = { all: ["admin", "settings"] as const };

export function SettingsTabs() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: settingsKeys.all,
    queryFn: settingsApi.get,
  });
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setSettings(data);
  }, [data]);

  function patchGeneral(patch: Partial<GeneralSettings>) {
    setSettings((prev) => (prev ? { ...prev, general: { ...prev.general, ...patch } } : prev));
  }
  function patchLegal(patch: Partial<LegalSettings>) {
    setSettings((prev) => (prev ? { ...prev, legal: { ...prev.legal, ...patch } } : prev));
  }
  function patchSocialLinks(patch: Partial<SocialLinks>) {
    setSettings((prev) => (prev ? { ...prev, socialLinks: { ...prev.socialLinks, ...patch } } : prev));
  }

  async function handleSave() {
    if (!settings) return;
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
    try {
      const saved = await settingsApi.update(settings);
      setSettings(saved);
      await queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      await queryClient.invalidateQueries({ queryKey: ["public-settings"] });
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !settings) {
    return <Skeleton className="h-64 w-full" />;
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
