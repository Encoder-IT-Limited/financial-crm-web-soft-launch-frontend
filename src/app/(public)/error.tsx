"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <p className="text-lg font-bold text-text">Something went wrong</p>
      <button
        onClick={reset}
        className="rounded-lg bg-blue px-4 py-2 text-[12.5px] font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
