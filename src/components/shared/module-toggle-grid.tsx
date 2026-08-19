import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MODULE_LABELS, type ModuleKey } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type ModuleToggleGridProps = {
  value: ModuleKey[];
  onChange: (next: ModuleKey[]) => void;
  className?: string;
};

const ALL_MODULES = Object.keys(MODULE_LABELS) as ModuleKey[];

export function ModuleToggleGrid({ value, onChange, className }: ModuleToggleGridProps) {
  function toggle(moduleKey: ModuleKey, checked: boolean) {
    onChange(checked ? [...value, moduleKey] : value.filter((m) => m !== moduleKey));
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}>
      {ALL_MODULES.map((moduleKey) => {
        const id = `module-${moduleKey}`;
        return (
          <label
            key={moduleKey}
            htmlFor={id}
            className="flex items-center gap-2.5 rounded-lg border border-border p-3 text-[12.5px] hover:border-text-4"
          >
            <Checkbox
              id={id}
              checked={value.includes(moduleKey)}
              onCheckedChange={(checked) => toggle(moduleKey, checked === true)}
            />
            <Label htmlFor={id} className="cursor-pointer text-text-2">
              {MODULE_LABELS[moduleKey]}
            </Label>
          </label>
        );
      })}
    </div>
  );
}
