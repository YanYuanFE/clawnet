import { Outlet, Link, useLocation } from "react-router-dom";
import { cn } from "../lib/cn";

const navItems = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/agents", label: "Agents" },
  { path: "/skills", label: "Skills" },
  { path: "/transactions", label: "Transactions" },
  { path: "/join", label: "Join" },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-dvh bg-zinc-950">
      <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/clawnet-icon.png" alt="ClawNet" className="size-7" />
            <span className="font-display font-semibold text-zinc-50">ClawNet</span>
          </Link>
          <div className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm transition-colors",
                  location.pathname === item.path || location.pathname.startsWith(item.path + "/")
                    ? "bg-zinc-800 text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
