import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { OfflineIndicator } from "@/components/common/OfflineIndicator";
import { FAB } from "@/components/common/FAB";

export function Layout() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Jeden przewijany obszar: tylko main; body nie przewija (unika podwójnego scrolla).
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Po każdej zmianie trasy (np. powrót po zapisie) przewijaj widok na górę.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    window.scrollTo(0, 0);
  }, [location.pathname, location.key]);

  return (
    <div className="flex h-screen max-h-screen min-h-0 flex-col overflow-hidden bg-background">
      <OfflineIndicator />
      <Header />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main
          ref={mainRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-24 pt-4 lg:px-8 lg:pb-8"
        >
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <FAB />
    </div>
  );
}
