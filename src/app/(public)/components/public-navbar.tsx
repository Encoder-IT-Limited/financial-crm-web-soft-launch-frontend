import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-blue to-purple text-sm font-extrabold text-white shadow-sm shadow-blue/30">
            M
          </div>
          <span className="text-sm font-bold text-text">MRM Portal</span>
        </Link>
        <nav className="flex items-center gap-5 text-[13px] font-medium text-text-2">
          <Link href="/#features" className="hidden transition-colors hover:text-blue sm:inline">
            Features
          </Link>
          <Link href="/pricing" className="hidden transition-colors hover:text-blue sm:inline">
            Pricing
          </Link>
          <Link href="/login" className="transition-colors hover:text-blue">
            Log in
          </Link>
          <Link
            href="/login"
            className="group flex items-center gap-1.5 rounded-lg bg-blue px-4 py-2 font-semibold text-white shadow-sm shadow-blue/30 transition-all hover:shadow-md hover:shadow-blue/40 hover:brightness-110"
          >
            Get started
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
