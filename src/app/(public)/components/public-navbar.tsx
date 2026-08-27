"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Menu } from "lucide-react";
import { usePublicSettings } from "../modules/settings/hooks/use-public-settings";
import { PlatformLogo } from "@/components/shared/platform-logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { data } = usePublicSettings();
  const platformName = data?.platformName ?? "";
  const logoUrl = data?.logoUrl ?? "";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/75 backdrop-blur-md">
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-4 sm:px-8 ">
        <Link href="/" className="flex items-center gap-2.5 justify-self-start">
          <PlatformLogo
            logoUrl={logoUrl}
            platformName={platformName}
            size="size-9"
            className="text-base"
          />
          <span className="text-base font-bold text-text">
            {platformName}
          </span>
        </Link>
        <div className="">
          <nav className="hidden items-center gap-8 text-[14.5px] font-medium text-text-2 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative py-1 transition-colors hover:text-text"
              >
                {link.label}
                <span className="absolute -bottom-0.5 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-linear-to-r from-blue to-purple transition-all duration-300 ease-out group-hover:w-full" />
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center justify-end gap-3 text-[14.5px] font-medium">
          <Link
            href="/login"
            className="hidden text-text-2 transition-colors hover:text-text sm:inline"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="group hidden items-center gap-1.5 rounded-lg bg-blue px-4 py-2.5 font-semibold text-white shadow-sm shadow-blue/30 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue/40 hover:brightness-110 sm:flex"
          >
            Get started
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Open menu"
              className="flex items-center justify-center rounded-md p-2 text-text-2 transition-colors hover:text-text sm:hidden"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b border-border px-5 py-4">
                <SheetTitle className="text-left">
                  <Link
                    href="/"
                    className="flex items-center gap-2.5"
                    onClick={() => setOpen(false)}
                  >
                    <PlatformLogo
                      logoUrl={logoUrl}
                      platformName={platformName}
                      size="size-8"
                      className="text-sm"
                    />
                    <span className="text-sm font-bold text-text">
                      {platformName}
                    </span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-text-2 transition-colors hover:bg-surface-subtle hover:text-text"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="flex flex-col gap-2 border-t border-border p-4">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-text-2 transition-colors hover:bg-surface-subtle hover:text-text"
                >
                  Log in
                </Link>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="group flex items-center justify-center gap-1.5 rounded-lg bg-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue/30 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue/40 hover:brightness-110"
                >
                  Get started
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
