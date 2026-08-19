"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Moon, Sun, LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "./theme-provider";
import type { Me } from "@/types/identity";
import { authService } from "@/lib/auth/auth.service";

type NavbarProps = {
  portal: "admin" | "tenant";
  me?: Me | null;
};

export function Navbar({ portal, me }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const router = useRouter();

  async function handleSignOut() {
    await authService.logout();
    queryClient.clear();
    router.replace("/login");
  }

  const initials = me?.name?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 print:hidden">
      <SidebarTrigger />

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

      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex size-[30px] items-center justify-center rounded-full bg-blue text-[11px] font-bold text-white"
        >
          {initials}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-48">
          <DropdownMenuLabel className="truncate font-normal text-text-3">
            {me?.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="size-3.5" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
