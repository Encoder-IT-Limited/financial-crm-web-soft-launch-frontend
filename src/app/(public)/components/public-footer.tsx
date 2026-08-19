import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const PRODUCT_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
  { label: "Log in", href: "/login" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

function FooterLink({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex w-fit items-center gap-1 text-[13px] text-white/60 transition-colors hover:text-white"
    >
      {label}
      <ArrowUpRight className="size-3 -translate-x-0.5 translate-y-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
    </Link>
  );
}

export function PublicFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-navy px-5 py-16 sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-180px] left-1/2 h-[360px] w-[600px] -translate-x-1/2 rounded-full bg-blue/15 blur-[120px]"
      />

      <div className="relative mx-auto grid max-w-5xl gap-10 sm:grid-cols-[1.3fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-blue to-purple text-sm font-extrabold text-white shadow-sm shadow-blue/30">
              M
            </div>
            <span className="text-sm font-bold text-white">MRM Portal</span>
          </Link>
          <p className="max-w-[220px] text-[12.5px] text-white/50">
            Run your business finances in one place.
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          <span className="text-[11px] font-bold tracking-wide text-white/35 uppercase">Product</span>
          {PRODUCT_LINKS.map((link) => (
            <FooterLink key={link.href} {...link} />
          ))}
        </div>

        <div className="flex flex-col gap-3.5">
          <span className="text-[11px] font-bold tracking-wide text-white/35 uppercase">Legal</span>
          {LEGAL_LINKS.map((link) => (
            <FooterLink key={link.href} {...link} />
          ))}
        </div>
      </div>

      <div className="relative mx-auto mt-12 max-w-5xl border-t border-white/10 pt-6 text-[12px] text-white/40">
        © {new Date().getFullYear()} MRM Portal. All rights reserved.
      </div>
    </footer>
  );
}
