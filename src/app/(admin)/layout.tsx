"use client";

import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { SessionEvents } from "@/providers/SessionEvents";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { SidebarCollapseProvider } from "@/components/shared/SidebarCollapseProvider";
import { AuthGate } from "@/components/shared/AuthGate";
import { Navbar } from "@/components/shared/Navbar";
import { AdminSidebar } from "./components/AdminSidebar";

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
