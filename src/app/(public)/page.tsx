import Link from "next/link";
import { PublicNavbar } from "./components/public-navbar";
import { PublicFooter } from "./components/public-footer";

export default function LandingPage() {
  return (
    <>
      <PublicNavbar />

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

      <PublicFooter />
    </>
  );
}
