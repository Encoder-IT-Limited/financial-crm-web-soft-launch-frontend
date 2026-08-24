import { PublicNavbar } from "./components/public-navbar";
import { PublicFooter } from "./components/public-footer";
import { ReactQueryProvider } from "@/providers/react-query-provider";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <div className="flex min-h-dvh flex-col bg-background">
        <PublicNavbar />
        {children}
        <PublicFooter />
      </div>
    </ReactQueryProvider>
  );
}
