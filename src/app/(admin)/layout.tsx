"use client";

import { ReactQueryProvider } from "@/providers/react-query-provider";
import { SessionEvents } from "@/providers/session-events";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { SidebarCollapseProvider } from "@/components/shared/sidebar-collapse-provider";
import { AuthGate } from "@/components/shared/auth-gate";
import { Navbar } from "@/components/shared/navbar";
import { AdminSidebar } from "./components/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <SessionEvents />
      <ThemeProvider>
        <SidebarCollapseProvider>
          <AuthGate realm="admin">
            {(me) => (
              <div className="flex h-dvh overflow-hidden bg-background">
                <AdminSidebar me={me} />
                <div className="flex h-dvh flex-1 flex-col overflow-hidden">
                  <div className="flex flex-1 flex-col overflow-hidden border-border lg:m-[10px] lg:rounded-[10px] lg:border">
                    <Navbar portal="admin" me={me} />
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
