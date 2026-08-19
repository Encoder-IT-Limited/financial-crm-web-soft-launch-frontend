import { cn } from "@/lib/utils";

type AuthCardProps = {
  children: React.ReactNode;
  className?: string;
};

/** Shared visual shell for auth-flow pages (login, signup) — the centered
 * white card on the navy background, matching the prototype's login screen. */
export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <main className="flex flex-1 items-center justify-center bg-navy px-4 py-10">
      <div className={cn("w-[420px] max-w-full rounded-[20px] bg-surface p-8 shadow-2xl sm:p-11", className)}>
        {children}
      </div>
    </main>
  );
}
