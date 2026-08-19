import { PageHeading } from "./page-heading";

/** Placeholder for a module page scheduled for a later build step — keeps
 * navigation and routing fully wired while the real page is built. */
export function ComingSoon({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <PageHeading title={title} subtitle={subtitle} />
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-center">
        <p className="text-[13px] font-semibold text-text-3">Coming soon</p>
        <p className="max-w-xs text-[12px] text-text-4">
          This module is scheduled for a later build step.
        </p>
      </div>
    </div>
  );
}
