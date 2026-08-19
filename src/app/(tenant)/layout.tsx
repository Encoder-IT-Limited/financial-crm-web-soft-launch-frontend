"use client";

import { ReactQueryProvider } from "@/providers/react-query-provider";
import { SessionEvents } from "@/providers/session-events";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { SidebarCollapseProvider } from "@/components/shared/sidebar-collapse-provider";
import { AuthGate } from "@/components/shared/auth-gate";
import { Navbar } from "@/components/shared/navbar";
import { TenantSidebar } from "./components/tenant-sidebar";

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <SessionEvents />
      <ThemeProvider>
        <SidebarCollapseProvider>
          {/* Gate the whole shell — sidebar + navbar + content — not just
              {children}, so no authenticated-looking chrome flashes before
              an unauthenticated visitor is redirected. */}
          <AuthGate realm="tenant">
            {(me) => (
              <div className="flex h-dvh overflow-hidden bg-background">
                <TenantSidebar me={me} />
                <div className="flex h-dvh flex-1 flex-col overflow-hidden">
                  <div className="flex flex-1 flex-col overflow-hidden border-border lg:m-[10px] lg:rounded-[10px] lg:border">
                    <Navbar portal="tenant" me={me} />
                    <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
                  </div>
                </div>
              </div>
            )}
          </AuthGate>
        </SidebarCollapseProvider>
      </ThemeProvider>
    </ReactQueryProvider>
  );
}
