import Link from "next/link";

export function PublicNavbar() {
  return (
    <header className="flex items-center justify-between px-5 py-4 sm:px-8">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-blue text-sm font-extrabold text-white">
          M
        </div>
        <span className="text-sm font-bold text-text">MRM Portal</span>
      </Link>
      <nav className="flex items-center gap-4 text-[13px] font-medium text-text-2">
        <Link href="/pricing" className="hover:text-blue">
          Pricing
        </Link>
        <Link
          href="/login"
          className="rounded-lg bg-blue px-4 py-2 font-semibold text-white hover:brightness-110"
        >
          Log in
        </Link>
      </nav>
    </header>
  );
}
