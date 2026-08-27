import { Suspense } from "react";
import { NewProposalPage } from "../components/new-proposal-page";

export default function Page() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />}>
      <NewProposalPage />
    </Suspense>
  );
}
