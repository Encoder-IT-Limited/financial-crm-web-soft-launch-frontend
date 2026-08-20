import { cn } from "@/lib/utils";

/** Renders the uploaded logo image, or a gradient letter-mark fallback
 * derived from the platform name when no logo has been uploaded yet. Shared
 * by the public navbar/footer and the admin Settings preview so all three
 * stay in sync. */
export function PlatformLogo({
  logoUrl,
  platformName,
  size = "size-9",
  className,
}: {
  logoUrl: string;
  platformName: string;
  size?: string;
  className?: string;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data: URLs / arbitrary uploads aren't compatible with next/image's optimizer
      <img
        src={logoUrl}
        alt={platformName}
        className={cn(size, "rounded-lg object-cover", className)}
      />
    );
  }

  const initial = platformName.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className={cn(
        size,
        "flex items-center justify-center rounded-lg bg-linear-to-br from-blue to-purple font-extrabold text-white shadow-sm shadow-blue/30",
        className
      )}
    >
      {initial}
    </div>
  );
}
