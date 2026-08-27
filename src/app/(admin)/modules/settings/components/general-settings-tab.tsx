"use client";

import { useRef } from "react";
import { Upload, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/form-field";
import { PlatformLogo } from "@/components/shared/platform-logo";
import { SettingsSection } from "./settings-section";
import type { GeneralSettings } from "../types";

export function GeneralSettingsTab({
  value,
  errors,
  onChange,
}: {
  value: GeneralSettings;
  errors: Record<string, string>;
  onChange: (patch: Partial<GeneralSettings>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange({ logoUrl: reader.result as string });
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-4">
      <SettingsSection
        title="Platform identity"
        description="Name, logo, and tagline shown across the public site, auth pages, and portal chrome."
      >
        <div className="flex items-center gap-4">
          <PlatformLogo logoUrl={value.logoUrl} platformName={value.platformName} size="size-16" className="text-2xl" />
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload /> Upload logo
              </Button>
              {value.logoUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ logoUrl: "" })}>
                  <Trash2 /> Remove
                </Button>
              )}
            </div>
            <p className="text-[11px] text-text-4 min-[1440px]:text-[12px]">PNG or SVG, square, at least 128×128px.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Platform name" error={errors.platformName}>
            <Input value={value.platformName} onChange={(e) => onChange({ platformName: e.target.value })} />
          </FormField>
          <FormField label="Tagline" error={errors.tagline}>
            <Input value={value.tagline} onChange={(e) => onChange({ tagline: e.target.value })} />
          </FormField>
          <FormField label="Contact email" error={errors.contactEmail}>
            <Input
              type="email"
              value={value.contactEmail}
              onChange={(e) => onChange({ contactEmail: e.target.value })}
            />
          </FormField>
          <FormField label="Currency" error={errors.currency}>
            <Input
              value={value.currency}
              onChange={(e) => onChange({ currency: e.target.value.toUpperCase() })}
              placeholder="AED"
            />
          </FormField>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Maintenance mode"
        description="Platform-wide — when enabled, the public site shows a maintenance page instead of normal content."
      >
        <label className="flex items-center gap-2.5">
          <Switch
            checked={value.maintenanceEnabled}
            onCheckedChange={(checked) => onChange({ maintenanceEnabled: checked === true })}
          />
          <Label className="cursor-pointer text-[12.5px] text-text-2 min-[1440px]:text-[13.5px]">
            Enable maintenance mode
          </Label>
        </label>
        <FormField label="Maintenance message" error={errors.maintenanceMessage}>
          <textarea
            rows={3}
            value={value.maintenanceMessage}
            onChange={(e) => onChange({ maintenanceMessage: e.target.value })}
            className="w-full resize-none rounded-[7px] border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-blue min-[1440px]:text-[14px]"
          />
        </FormField>
      </SettingsSection>
    </div>
  );
}
