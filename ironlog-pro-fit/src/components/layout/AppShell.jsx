import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Dumbbell, LayoutGrid, BarChart3, Ruler, ListChecks, Users } from "lucide-react";

const NAV = [
  { to: "/", label: "Train", icon: Dumbbell },
  { to: "/community", label: "Community", icon: Users },
  { to: "/routines", label: "Routines", icon: ListChecks },
  { to: "/exercises", label: "Library", icon: LayoutGrid },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/progress", label: "Body", icon: Ruler },
];

export default function AppShell() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-3xl px-5 pb-32 pt-8" style={{ paddingTop: "max(2rem, env(safe-area-inset-top))" }}>
        <Outlet />
      </div>
      <nav className="fixed bottom-0 inset-x-0 border-t border-white/10 bg-neutral-950/90 backdrop-blur-xl" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-auto flex max-w-3xl">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] tracking-wide transition-colors ${
                  active ? "text-lime-300" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}