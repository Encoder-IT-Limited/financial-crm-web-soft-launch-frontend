import Link from "next/link";
import { ArrowRight } from "lucide-react";

type FinalCtaBannerProps = {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function FinalCtaBanner({
  title = "Ready to get started?",
  subtitle = "14-day free trial, no credit card required.",
  ctaLabel = "Get started",
  ctaHref = "/login",
}: FinalCtaBannerProps) {
  return (
    <section className="px-5 pb-20 sm:px-8">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-linear-to-br from-navy via-navy to-blue px-8 py-16 text-center shadow-xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] opacity-[0.08] [background-size:22px_22px]"
        />
        <div className="relative">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">{title}</h2>
          <p className="mt-2 text-[13.5px] text-white/70">{subtitle}</p>
          <Link
            href={ctaHref}
            className="mt-7 inline-flex items-center gap-1.5 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-navy shadow-lg transition-transform hover:scale-[1.02]"
          >
            {ctaLabel}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
