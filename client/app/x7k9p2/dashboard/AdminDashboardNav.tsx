"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { AdminSessionPayload } from "@/lib/admin-session";
import { getAdminBasePath } from "@/lib/admin-config";

function hasPermission(
  session: AdminSessionPayload,
  permission: string
): boolean {
  if (session.isMaster || session.role === "master") return true;
  if (session.role === "admin") return true;
  if (session.role === "crewmate") return permission === "checkin";
  if (session.role === "camsguy") return true;
  if (session.role === "imposter")
    return session.permissions.includes(permission as "checkin" | "registrations" | "events" | "users");
  return false;
}

function canManageUsers(session: AdminSessionPayload): boolean {
  return !!session.isMaster || session.role === "master" || session.role === "admin";
}

function canViewUsers(session: AdminSessionPayload): boolean {
  return canManageUsers(session);
}

export default function AdminDashboardNav({
  session,
}: {
  session: AdminSessionPayload;
}) {
  const pathname = usePathname();
  const basePath = getAdminBasePath();
  const base = `/${basePath}/dashboard`;
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems: { href: string; label: string; show: boolean }[] = [
    { href: base, label: "Home", show: true },
    { href: `${base}/users`, label: "Users", show: canViewUsers(session) },
    {
      href: `${base}/checkin`,
      label: "Check-in",
      show: hasPermission(session, "checkin"),
    },
    {
      href: `${base}/registrations`,
      label: "Registrations",
      show: hasPermission(session, "registrations"),
    },
    {
      href: `${base}/events`,
      label: "Events",
      show: hasPermission(session, "events"),
    },
    {
      href: `${base}/participants`,
      label: "Participants",
      show: hasPermission(session, "users"),
    },
    {
      href: `${base}/seed`,
      label: "Seed",
      show: !!session.isMaster || session.role === "master",
    },
  ].filter((item) => item.show);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={base} className="text-cyan font-bold text-lg shrink-0 uppercase tracking-wider">
            {session.role}
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2.5 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === item.href
                    ? "bg-cyan/20 text-cyan border border-cyan/50"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop right side */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <span className="text-white/60 text-sm truncate max-w-[180px]" title={session.email}>
              {session.email}
              {session.isMaster && " (Master)"}
            </span>
            <form action="/api/admin-panel/logout" method="POST">
              <button
                type="submit"
                className="hand-drawn-button py-1.5 px-3 text-sm whitespace-nowrap"
                style={{ background: "rgba(255, 70, 85, 0.9)" }}
              >
                Logout
              </button>
            </form>
          </div>

          {/* Hamburger — shown on mobile & tablet (below lg) */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="lg:hidden text-white/80 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-black/95 px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-cyan/20 text-cyan border border-cyan/50"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          ))}

          <div className="my-2 border-t border-white/10" />

          <span className="text-white/50 text-xs px-3 pb-1">
            {session.email}
            {session.isMaster && " (Master)"}
          </span>
          <form action="/api/admin-panel/logout" method="POST">
            <button
              type="submit"
              className="hand-drawn-button py-1.5 px-3 text-sm w-full"
              style={{ background: "rgba(255, 70, 85, 0.9)" }}
            >
              Logout
            </button>
          </form>
        </div>
      )}
    </nav>
  );
}