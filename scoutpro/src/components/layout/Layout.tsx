import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { OfflineIndicator } from "@/components/common/OfflineIndicator";
import { FAB } from "@/components/common/FAB";

export function Layout() {
  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-background">
      <OfflineIndicator />
      <Header />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-24 pt-4 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <FAB />
    </div>
  );
}
