import { Link, Outlet, useLocation } from "react-router-dom";
import { Calendar, Building2, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/BrandLogo";

const adminLinks = [
  { href: "/admin/events", label: "Events", icon: Calendar },
  { href: "/admin/companies", label: "Sponsors & Partners", icon: Building2 },
  { href: "/admin/people", label: "People", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-64 flex-shrink-0 border-r border-zinc-800 bg-brand-950 text-white lg:block">
        <div className="flex h-16 items-center gap-3 px-6">
          <BrandLogo variant="mark" className="h-10" />
          <span className="font-semibold">Admin</span>
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "bg-brand-800 text-white"
                  : "text-brand-200 hover:bg-brand-900 hover:text-white"
              )}
            >
              <link.icon size={18} />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto bg-zinc-900">
        <div className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 lg:hidden">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-100">Admin</span>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "bg-brand-600 text-white"
                    : "bg-zinc-800 text-zinc-400"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
