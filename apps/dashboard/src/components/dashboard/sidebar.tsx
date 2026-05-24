"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, CalendarDays, ShoppingCart, CheckCircle,
  Ticket, Users, Shield, Gift, Star, Link2, Megaphone,
  BarChart2, Settings, ScrollText, Server, Zap,
} from "lucide-react";

const NAV = [
  { href: "/overview",      label: "Overview",        icon: LayoutDashboard },
  { href: "/events",        label: "Events",          icon: CalendarDays },
  { href: "/carts",         label: "Carts",           icon: ShoppingCart },
  { href: "/claims",        label: "Claims",          icon: CheckCircle },
  { href: "/tickets",       label: "Tickets",         icon: Ticket },
  { href: "/users",         label: "Users",           icon: Users },
  { href: "/roles",         label: "Roles",           icon: Shield },
  { href: "/giveaways",     label: "Giveaways",       icon: Gift },
  { href: "/interest-checks", label: "Interest Checks", icon: Star },
  { href: "/invites",       label: "Invites",         icon: Link2 },
  { href: "/announcements", label: "Annonces",        icon: Megaphone },
  { href: "/wts",           label: "WTS Generator",   icon: Zap },
  { href: "/analytics",     label: "Analytics",       icon: BarChart2 },
  { href: "/logs",          label: "Logs",            icon: ScrollText },
  { href: "/server-setup",  label: "Server Setup",    icon: Server },
  { href: "/settings",      label: "Settings",        icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-discord-darker border-r border-white/5 flex flex-col shrink-0">
      <div className="h-16 flex items-center px-5 border-b border-white/5">
        <span className="text-lg font-bold text-white">🎫 Manager</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
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
