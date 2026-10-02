import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh">
      <div className="contents print:hidden">
        <Sidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="contents print:hidden">
          <Header />
        </div>
        <main className="flex-1 space-y-6 p-4 sm:p-6 print:p-0">{children}</main>
      </div>
    </div>
  );
}
