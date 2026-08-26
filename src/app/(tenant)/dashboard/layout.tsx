import type { Metadata } from "next";

/** App portals must not appear in search results. */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function DashboardSegmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
