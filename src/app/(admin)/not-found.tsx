import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <p className="text-lg font-bold text-text">Page not found</p>
      <p className="text-[13px] text-text-3">This page doesn&apos;t exist or was moved.</p>
      <Link href="/admin" className="mt-2 text-[13px] font-semibold text-blue">
        Back to admin
      </Link>
    </div>
  );
}
