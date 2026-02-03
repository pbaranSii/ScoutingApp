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
      <div className="flex min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 px-4 pb-24 pt-4 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <FAB />
    </div>
  );
}
