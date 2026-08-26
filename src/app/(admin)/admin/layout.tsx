import type { Metadata } from "next";

/** Super Admin portal must not appear in search results. */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminSegmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
