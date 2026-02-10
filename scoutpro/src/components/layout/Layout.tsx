import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { OfflineIndicator } from "@/components/common/OfflineIndicator";
import { FAB } from "@/components/common/FAB";

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <OfflineIndicator />
      <Header />
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden lg:h-screen">
        <Sidebar />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-24 pt-4 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <FAB />
    </div>
  );
}
