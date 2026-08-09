import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/BrandLogo";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/sponsors", label: "Sponsors & Partners" },
  { href: "/people", label: "Community" },
  { href: "/get-involved", label: "Get Involved" },
];

export function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[86px] border-b border-white/[0.04] bg-[rgba(2,7,13,0.78)] backdrop-blur-[14px]">
      <nav className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-[5%]">
        <Link to="/" className="flex items-center gap-3" aria-label="Crewbase Collective home">
          <BrandLogo variant="mark" className="!h-11 sm:!h-12" />
          <span className="hidden leading-none sm:block">
            <span className="block text-[22px] font-extrabold tracking-[0.8px] text-white">
              CREW BASE
            </span>
            <span className="mt-1.5 block text-center text-[11px] font-semibold tracking-[5px] text-[var(--cyan)]">
              COLLECTIVE
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-9 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "text-[13px] uppercase tracking-[0.4px] transition",
                pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                  ? "text-[var(--cyan)]"
                  : "text-[#d8e1e8] hover:text-[var(--cyan)]"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          className="rounded-lg p-2 text-[#d8e1e8] hover:text-[var(--cyan)] lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/5 bg-[rgba(2,7,13,0.95)] px-[5%] py-4 backdrop-blur-xl lg:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block py-3 text-[13px] uppercase tracking-[0.4px]",
                pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                  ? "text-[var(--cyan)]"
                  : "text-[#d8e1e8]"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
