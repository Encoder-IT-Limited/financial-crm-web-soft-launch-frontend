import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function FormField({
  label,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-[11px] font-semibold text-text-2 min-[1440px]:text-[12px]">{label}</Label>
      {children}
      {error ? (
        <p className="text-[10.5px] text-red min-[1440px]:text-[11.5px]">{error}</p>
      ) : hint ? (
        <p className="text-[10.5px] text-text-4 min-[1440px]:text-[11.5px]">{hint}</p>
      ) : null}
    </div>
  );
}
