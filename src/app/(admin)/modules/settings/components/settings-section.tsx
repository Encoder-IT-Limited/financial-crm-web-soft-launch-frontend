import { Card } from "@/components/ui/card";

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6">
      <div>
        <h3 className="text-[14px] font-bold text-text min-[1440px]:text-[15px]">{title}</h3>
        {description && (
          <p className="mt-0.5 text-[12px] text-text-4 min-[1440px]:text-[13px]">{description}</p>
        )}
      </div>
      {children}
    </Card>
  );
}
