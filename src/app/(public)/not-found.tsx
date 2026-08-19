import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
      <p className="text-lg font-bold text-text">Page not found</p>
      <Link href="/" className="mt-2 text-[13px] font-semibold text-blue">
        Back home
      </Link>
    </div>
  );
}
