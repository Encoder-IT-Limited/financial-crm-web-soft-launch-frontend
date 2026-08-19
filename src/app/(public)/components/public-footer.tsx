import Link from "next/link";

const PRODUCT_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Log in", href: "/login" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border px-5 py-10 sm:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
        <div className="flex flex-col gap-2.5">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue text-xs font-extrabold text-white">
              M
            </div>
            <span className="text-sm font-bold text-text">MRM Portal</span>
          </Link>
          <p className="text-[12px] text-text-3">
            Run your business finances in one place.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-bold tracking-wide text-text-4 uppercase">Product</span>
          {PRODUCT_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-[12.5px] text-text-2 hover:text-blue">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-bold tracking-wide text-text-4 uppercase">Legal</span>
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-[12.5px] text-text-2 hover:text-blue">
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-5xl border-t border-border pt-6 text-center text-[12px] text-text-4">
        © {new Date().getFullYear()} MRM Portal. All rights reserved.
      </div>
    </footer>
  );
}
