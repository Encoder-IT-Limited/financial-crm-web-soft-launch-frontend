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
  const posMode = pathname === "/dashboard/pos" || pathname.startsWith("/dashboard/pos/");

  return (
    <ReactQueryProvider>
      <SessionEvents />
      <ThemeProvider>
        <AuthGate realm="tenant">
          {(me) => (
            <SidebarProvider className="h-dvh overflow-hidden bg-background">
              <TenantSidebar me={me} />
              <div className="flex h-dvh flex-1 flex-col overflow-hidden">
                <div
                  className={cn(
                    "flex flex-1 flex-col overflow-hidden border-border lg:m-[10px] lg:rounded-[10px] lg:border",
                    posMode && "lg:m-2",
                  )}
                >
                  <Navbar portal="tenant" me={me} />
                  <main
                    className={cn(
                      "flex-1 overflow-auto p-4 print:overflow-visible print:p-0 lg:p-6",
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
