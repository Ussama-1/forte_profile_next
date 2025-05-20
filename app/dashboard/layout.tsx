import { Suspense } from "react";
import { MobileHeader, MobileSidebar } from "@/components/mobile-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex  overflow-y-auto bg-slate-50 !max-h-screen">
      {/* Sidebar */}
      <MobileSidebar />

      <main className="flex-1 overflow-y-auto max-w-6xl mx-auto   ">
        <div className="container mx-auto p-4">
          <MobileHeader />
          <Suspense>{children}</Suspense>
        </div>
      </main>
    </div>
  );
}
