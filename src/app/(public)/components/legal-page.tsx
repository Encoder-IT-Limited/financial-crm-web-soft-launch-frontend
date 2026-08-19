type LegalPageProps = {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
};

/** Shared shell for /privacy and /terms — title, "last updated" line, and a
 * prose container. Content is placeholder copy until legal provides the real
 * text; keep this shell so swapping content later doesn't touch layout. */
export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  return (
    <main className="flex-1 px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-extrabold text-text sm:text-3xl">{title}</h1>
        <p className="mt-1 text-[12px] text-text-4">Last updated: {lastUpdated}</p>
        <div className="mt-8 flex flex-col gap-5 text-[13px] leading-relaxed text-text-2 [&_h2]:mt-4 [&_h2]:text-[15px] [&_h2]:font-bold [&_h2]:text-text">
          {children}
        </div>
      </div>
    </main>
  );
}
