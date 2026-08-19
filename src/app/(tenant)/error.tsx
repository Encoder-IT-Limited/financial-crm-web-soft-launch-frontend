"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <p className="text-lg font-bold text-text">Something went wrong</p>
      <p className="text-[13px] text-text-3">Try again, or come back later if it persists.</p>
      <button
        onClick={reset}
        className="rounded-lg bg-blue px-4 py-2 text-[12.5px] font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
