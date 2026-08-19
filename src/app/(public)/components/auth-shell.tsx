import Link from "next/link";
import { BookText, Landmark, Wallet, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: React.ReactNode;
  /** Replaces the default floating module chips at the bottom of the left
   * panel — used by /signup to show step progress instead. */
  leftFooter?: React.ReactNode;
  /** Widen the form column for steps with more fields (e.g. signup's info/
   * payment steps). Defaults to a narrow single-field-column width. */
  contentClassName?: string;
};

const FLOATING_CARDS = [
  { icon: BookText, label: "Accounting", offset: "top-0 left-0" },
  { icon: Wallet, label: "Expenses", offset: "top-[4.5rem] left-14" },
  { icon: Landmark, label: "Banking", offset: "top-[2.25rem] left-[-0.25rem]" },
];

function DefaultLeftFooter() {
  return (
    <div className="relative h-28">
      {FLOATING_CARDS.map((card, i) => (
        <div
          key={card.label}
          className={cn(
            "absolute flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3.5 py-2.5 shadow-lg backdrop-blur-sm",
            card.offset
          )}
          style={{ zIndex: FLOATING_CARDS.length - i }}
        >
          <card.icon className="size-3.5 text-white/80" />
          <span className="text-[11px] font-semibold text-white/80">{card.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Split-screen shell shared by every auth page — a beautifully branded
 * panel on the left, form content (passed as children) on the right. */
export function AuthShell({ children, leftFooter, contentClassName }: AuthShellProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy p-10 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute top-[-160px] right-[-120px] h-[420px] w-[420px] rounded-full bg-blue/30 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-180px] left-[-100px] h-[360px] w-[360px] rounded-full bg-purple/25 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_75%_65%_at_25%_15%,#000_35%,transparent_100%)]"
        />

        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-linear-to-br from-blue to-purple text-base font-extrabold text-white shadow-sm shadow-blue/30">
            M
          </div>
          <span className="text-base font-bold">MRM Portal</span>
        </Link>

        <div className="relative max-w-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
            <Sparkles className="size-3 text-blue" />
            Multi-tenant SaaS platform
          </span>
          <p className="mt-5 text-3xl leading-[1.2] font-extrabold">
            Run your business{" "}
            <span className="bg-linear-to-r from-blue to-purple bg-clip-text text-transparent">
              finances
            </span>{" "}
            in one place.
          </p>
          <p className="mt-4 text-[13.5px] text-white/60">
            Accounting, invoicing, inventory, banking, and CRM for growing teams — one
            platform instead of six disconnected tools.
          </p>
        </div>

        <div className="relative">{leftFooter ?? <DefaultLeftFooter />}</div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background px-5 py-16 sm:px-8">
        <div className={cn("w-full max-w-sm", contentClassName)}>{children}</div>
      </div>
    </div>
  );
}
