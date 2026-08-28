"use client";

import { usePathname } from "next/navigation";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { SessionEvents } from "@/providers/session-events";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { AuthGate } from "@/components/shared/auth-gate";
import { Navbar } from "@/components/shared/navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TenantSidebar } from "./components/tenant-sidebar";
import { cn } from "@/lib/utils";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Only the register screen itself is the full-bleed, no-scroll layout —
  // Terminals/Sessions/Sales live under /dashboard/pos/* too but are
  // ordinary padded, scrollable list pages like the rest of the dashboard.
  // Matching the whole prefix made those three inherit overflow-hidden and
  // zero padding, clipping their tables with no way to scroll to the rest.
  const posMode = pathname === "/dashboard/pos";

  return (
    <ReactQueryProvider>
      <SessionEvents />
      <ThemeProvider>
        <AuthGate realm="tenant">
          {(me) => (
            <SidebarProvider className="h-dvh overflow-hidden bg-background">
              <TenantSidebar me={me} />
              {/* min-h-0 throughout this chain — flex items default to
                  min-height: auto, which refuses to shrink below content
                  size even inside an overflow-hidden ancestor. Without it,
                  `main` (and posMode's h-full register screen inside it)
                  grows to fit content instead of clipping to the viewport,
                  which is exactly the old cut-off-with-no-scroll bug. */}
              <div className="flex h-dvh min-h-0 flex-1 flex-col overflow-hidden">
                <div
                  className={cn(
                    "flex min-h-0 flex-1 flex-col overflow-hidden border-border lg:m-[10px] lg:rounded-[10px] lg:border",
                    posMode && "lg:m-2",
                  )}
                >
                  <Navbar portal="tenant" me={me} />
                  <main
                    className={cn(
                      "min-h-0 flex-1 overflow-auto p-4 print:overflow-visible print:p-0 lg:p-6",
                      posMode && "overflow-hidden p-0 lg:p-0",
                    )}
                  >
                    {children}
                  </main>
                </div>
              </div>
            </SidebarProvider>
          )}
        </AuthGate>
      </ThemeProvider>
    </ReactQueryProvider>
  );
}
