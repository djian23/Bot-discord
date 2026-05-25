"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Tag,
  Ticket,
  BarChart2,
  Bell,
} from "lucide-react";

const NAV = [
  { href: "/my",              label: "My Dashboard",  icon: LayoutDashboard },
  { href: "/my/claims",       label: "My Claims",     icon: ShoppingCart },
  { href: "/my/listings",     label: "My Listings",   icon: Tag },
  { href: "/my/tickets",      label: "My Tickets",    icon: Ticket },
  { href: "/my/stats",        label: "My Stats",      icon: BarChart2 },
  { href: "/my/notifications", label: "Notifications", icon: Bell },
];

export function UserSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-discord-darker border-r border-white/5 flex flex-col shrink-0">
      <div className="h-16 flex items-center px-5 border-b border-white/5">
        <span className="text-lg font-bold text-white">👤 Mon Espace</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/my"
              ? pathname === "/my"
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-discord-blurple text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
