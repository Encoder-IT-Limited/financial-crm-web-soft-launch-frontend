import { pageMetadata } from "@/lib/seo";
import { FeatureDetailCard } from "../components/feature-detail-card";
import { FinalCtaBanner } from "../components/final-cta-banner";
import { MODULES } from "../components/modules-data";
import { FEATURE_CATEGORIES } from "./categories";

export const metadata = pageMetadata({
  title: "Features",
  description:
    "Explore accounting, sales, purchasing, inventory, banking, CRM, reports, and AI assistant modules built to work together.",
  path: "/features",
});

export default function FeaturesPage() {
  return (
    <>

      <main className="relative flex min-h-[60vh] flex-col justify-center overflow-hidden px-5 pt-16 pb-8 sm:px-8 sm:pt-24">
        <div
          aria-hidden
          className="pointer-events-none absolute top-[-140px] left-1/2 h-[380px] w-[680px] -translate-x-1/2 rounded-full bg-blue/15 blur-[120px]"
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-5xl">
            Everything your business runs on
          </h1>
          <p className="mt-4 text-[13.5px] text-text-3 sm:text-[15px]">
            One platform, built out module by module. Some are available today, the rest
            are on the way — either way, they&apos;re built to work together from day one.
          </p>
        </div>
      </main>

      {FEATURE_CATEGORIES.map((category, index) => {
        const items = MODULES.filter((m) => category.moduleKeys.includes(m.key));
        return (
          <section
            key={category.title}
            className={
              index % 2 === 1
                ? "border-t border-border bg-surface-subtle px-5 py-16 sm:px-8"
                : "border-t border-border px-5 py-16 sm:px-8"
            }
          >
            <div className="mx-auto max-w-5xl">
              <div className="max-w-xl">
                <h2 className="text-xl font-extrabold text-text sm:text-2xl">{category.title}</h2>
                <p className="mt-2 text-[13px] text-text-3">{category.description}</p>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <FeatureDetailCard key={item.key} item={item} />
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <div className="pt-4">
        <FinalCtaBanner />
      </div>

    </>
  );
}
