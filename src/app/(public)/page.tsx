import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue text-sm font-extrabold text-white">
            M
          </div>
          <span className="text-sm font-bold text-text">MRM Portal</span>
        </div>
        <nav className="flex items-center gap-4 text-[13px] font-medium text-text-2">
          <Link href="/pricing" className="hover:text-blue">
            Pricing
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-blue px-4 py-2 font-semibold text-white hover:brightness-110"
          >
            Log in
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
        <h1 className="max-w-2xl text-3xl font-extrabold text-text sm:text-5xl">
          Run your business finances in one place
        </h1>
        <p className="mt-4 max-w-xl text-[13px] text-text-3 sm:text-base">
          Accounting, invoicing, inventory, banking, and CRM for growing teams — built for
          multi-entity operators, backed by an AI assistant that does the busywork.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="rounded-lg bg-blue px-6 py-3 text-sm font-semibold text-white hover:brightness-110"
          >
            Get started
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-border bg-surface px-6 py-3 text-sm font-semibold text-text-2 hover:border-text-4"
          >
            View pricing
          </Link>
        </div>
      </main>

      <footer className="border-t border-border px-5 py-6 text-center text-[12px] text-text-4 sm:px-8">
        © {new Date().getFullYear()} MRM Portal. All rights reserved.
      </footer>
    </>
  );
}
