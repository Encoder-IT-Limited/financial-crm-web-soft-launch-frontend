import Link from "next/link";
import { ArrowRight } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/75 backdrop-blur-md">
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 justify-self-start">
          <div className="flex size-9 items-center justify-center rounded-lg bg-linear-to-br from-blue to-purple text-base font-extrabold text-white shadow-sm shadow-blue/30">
            M
          </div>
          <span className="text-base font-bold text-text">MRM Portal</span>
        </Link>

        <nav className="hidden items-center gap-8 text-[14.5px] font-medium text-text-2 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative py-1 transition-colors hover:text-text"
            >
              {link.label}
              <span className="absolute -bottom-0.5 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-linear-to-r from-blue to-purple transition-all duration-300 ease-out group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 justify-self-end text-[14.5px] font-medium">
          <Link href="/login" className="hidden text-text-2 transition-colors hover:text-text sm:inline">
            Log in
          </Link>
          <Link
            href="/login"
            className="group flex items-center gap-1.5 rounded-lg bg-blue px-4 py-2.5 font-semibold text-white shadow-sm shadow-blue/30 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue/40 hover:brightness-110"
          >
            Get started
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
