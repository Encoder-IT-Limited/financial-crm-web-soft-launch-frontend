"use client";

import { useState } from "react";
import { Menu, Bell, Moon, Sun, LogOut } from "lucide-react";
import { useSidebarCollapse } from "./SidebarCollapseProvider";
import { useTheme } from "./ThemeProvider";
import type { Me } from "@/types/identity";
import { authService } from "@/lib/auth/auth.service";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type NavbarProps = {
  portal: "admin" | "tenant";
  me?: Me | null;
};

export function Navbar({ portal, me }: NavbarProps) {
  const { setMobileOpen } = useSidebarCollapse();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  async function handleSignOut() {
    await authService.logout();
    queryClient.clear();
    router.replace("/login");
  }

  const initials = me?.name?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
      <button
        onClick={() => setMobileOpen(true)}
        className="rounded-md p-1.5 text-text-3 hover:bg-surface-subtle lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="min-w-0 flex-1">
        {portal === "tenant" && me?.tenant && (
          <span className="truncate text-sm font-semibold text-text">{me.tenant.name}</span>
        )}
        {portal === "admin" && <span className="text-sm font-semibold text-text">MRM Platform</span>}
      </div>

      <button
        onClick={toggleTheme}
        className="rounded-md p-2 text-slate hover:bg-surface-subtle"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>

      <button
        className="relative rounded-md p-2 text-slate hover:bg-surface-subtle"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        <span className="absolute right-1.5 top-1.5 size-[7px] rounded-full border border-surface bg-red" />
      </button>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex size-[30px] items-center justify-center rounded-full bg-blue text-[11px] font-bold text-white"
        >
          {initials}
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-[calc(100%+8px)] w-44 rounded-lg border border-border bg-surface p-1 shadow-lg">
            <div className="truncate px-2.5 py-1.5 text-xs text-text-3">{me?.email}</div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12.5px] text-text-2 hover:bg-surface-subtle"
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
