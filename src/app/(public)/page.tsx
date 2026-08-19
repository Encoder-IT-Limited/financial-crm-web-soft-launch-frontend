import Link from "next/link";
import { ArrowRight, Sparkles, Percent, FileCheck2, X, Check } from "lucide-react";
import { PublicNavbar } from "./components/public-navbar";
import { PublicFooter } from "./components/public-footer";
import { ModuleShowcaseCard } from "./components/module-showcase-card";
import { MODULES } from "./components/modules-data";
import { FinalCtaBanner } from "./components/final-cta-banner";

const PAIN_POINTS = [
  "Spreadsheets for expenses, a separate app for invoicing",
  "No real-time visibility into what's actually in stock",
  "A bookkeeper piecing it all together at month-end",
];

const RELIEF_POINTS = [
  "Sales, purchases, and inventory update the same source of truth",
  "Stock levels reflect every sale and receipt as it happens",
  "Reports stay current — no month-end scramble to reconcile",
];

export default function LandingPage() {
  return (
    <>
      <PublicNavbar />

      {/* Hero */}
      <main className="relative flex min-h-[90vh] flex-col justify-center overflow-hidden px-5 pt-16 pb-24 sm:px-8 sm:pt-24">
        {/* Ambient gradient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-[-120px] left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-blue/20 blur-[120px]"
        />
        {/* Fading dot grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_60%_55%_at_50%_0%,#000_55%,transparent_100%)]"
        />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold text-text-2 shadow-sm">
            <Sparkles className="size-3 text-blue" />
            AI-powered receipt scanning, built in
          </span>

          <h1 className="mt-6 text-4xl leading-[1.1] font-extrabold tracking-tight text-text sm:text-6xl">
            Run your business finances{" "}
            <span className="bg-linear-to-r from-blue to-purple bg-clip-text text-transparent">
              in one place
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-[14px] text-text-3 sm:text-[16px]">
            Accounting, invoicing, inventory, banking, and CRM for growing teams — one
            platform instead of six disconnected tools.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="group flex items-center justify-center gap-1.5 rounded-lg bg-blue px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue/30 transition-all hover:shadow-xl hover:shadow-blue/40 hover:brightness-110"
            >
              Get started
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-border bg-surface px-6 py-3 text-sm font-semibold text-text-2 transition-colors hover:border-text-4"
            >
              View pricing
            </Link>
          </div>
          <p className="mt-4 text-[11.5px] text-text-4">
            14-day free trial · No credit card required
          </p>
        </div>

        {/* Product preview mockup */}
        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-navy/10">
            <div className="flex items-center gap-1.5 border-b border-border bg-surface-subtle px-4 py-3">
              <span className="size-2.5 rounded-full bg-red/60" />
              <span className="size-2.5 rounded-full bg-amber/60" />
              <span className="size-2.5 rounded-full bg-green/60" />
            </div>
            <div className="flex">
              <div className="hidden w-44 shrink-0 flex-col gap-2 bg-navy p-4 sm:flex">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-md bg-blue text-[10px] font-extrabold text-white">
                    M
                  </div>
                  <span className="text-[11px] font-bold text-white">MRM Portal</span>
                </div>
                {["Dashboard", "Invoices", "Inventory", "Banking", "Reports"].map((label, i) => (
                  <div
                    key={label}
                    className={`rounded-md px-2.5 py-1.5 text-[10.5px] font-medium ${
                      i === 0 ? "bg-blue-l text-blue" : "text-white/60"
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="flex-1 space-y-3 bg-background p-5">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Income", value: "AED 84,200", tone: "text-green" },
                    { label: "Expenses", value: "AED 31,450", tone: "text-red" },
                    { label: "Net", value: "AED 52,750", tone: "text-blue" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-lg border border-border bg-surface p-3">
                      <div className="text-[9.5px] font-semibold text-text-4 uppercase">{m.label}</div>
                      <div className={`mt-1 text-[13px] font-extrabold ${m.tone}`}>{m.value}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <div className="mb-2 text-[10.5px] font-semibold text-text-2">Recent invoices</div>
                  {[
                    ["Al Futtaim Trading", "AED 4,200", "Paid"],
                    ["Noor Retail LLC", "AED 1,850", "Sent"],
                  ].map(([name, amount, status]) => (
                    <div key={name} className="flex items-center justify-between border-t border-border py-1.5 text-[10.5px] first:border-t-0">
                      <span className="text-text-2">{name}</span>
                      <span className="text-text-3">{amount}</span>
                      <span className={status === "Paid" ? "text-green" : "text-amber"}>{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Problem / relief comparison */}
      <section className="border-t border-border bg-surface-subtle px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold text-text sm:text-3xl">
            Stop reconciling six different tools by hand
          </h2>
        </div>
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 text-[11px] font-bold tracking-wide text-text-4 uppercase">
              Without MRM Portal
            </div>
            <ul className="flex flex-col gap-3">
              {PAIN_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-[13px] text-text-3">
                  <X className="mt-0.5 size-3.5 shrink-0 text-red" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-blue/30 bg-surface p-6 shadow-sm shadow-blue/[0.06]">
            <div className="mb-4 text-[11px] font-bold tracking-wide text-blue uppercase">
              With MRM Portal
            </div>
            <ul className="flex flex-col gap-3">
              {RELIEF_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-[13px] text-text-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-green" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Module showcase */}
      <section id="features" className="scroll-mt-16 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold text-text sm:text-3xl">
            Everything your business runs on
          </h2>
          <p className="mt-3 text-[13.5px] text-text-3">
            One platform, built out module by module — some available today, more shipping
            soon.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((item) => (
            <ModuleShowcaseCard key={item.key} item={item} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/features"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue hover:underline"
          >
            View all features
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* AI Assistant spotlight */}
      <section className="relative overflow-hidden border-t border-border bg-navy px-5 py-20 text-white sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue/25 blur-[100px]"
        />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-blue to-purple shadow-lg shadow-blue/30">
            <Sparkles className="size-5.5" />
          </div>
          <h2 className="text-2xl font-extrabold sm:text-3xl">Let AI handle the busywork</h2>
          <p className="max-w-xl text-[13.5px] text-white/70 sm:text-[14.5px]">
            Snap a photo of a receipt and the AI assistant reads the vendor, date, amount,
            tax, and category for you — you just review and approve. No manual data entry,
            no missed expenses.
          </p>
        </div>
      </section>

      {/* Compliance */}
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-4xl gap-10 sm:grid-cols-2 sm:items-center">
          <div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-green to-blue text-white shadow-sm shadow-green/25">
              <Percent className="size-4.5" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-text sm:text-2xl">
              Built for UAE VAT & Corporate Tax
            </h2>
            <p className="mt-2.5 text-[13.5px] text-text-3">
              VAT and Corporate Tax reports are built into the platform, not bolted on — so
              filing season isn&apos;t a scramble.
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <FileCheck2 className="size-9 shrink-0 text-blue" />
            <p className="text-[12.5px] text-text-2">
              Reports stay current as you invoice, purchase, and reconcile — ready whenever
              a filing deadline is.
            </p>
          </div>
        </div>
      </section>

      <FinalCtaBanner />

      <PublicFooter />
    </>
  );
}
