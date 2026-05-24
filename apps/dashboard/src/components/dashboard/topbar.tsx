"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";
import { LogOut } from "lucide-react";

interface TopBarProps {
  user: any;
}

export function TopBar({ user }: TopBarProps) {
  return (
    <header className="h-16 bg-discord-darker border-b border-white/5 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-3">
        {user?.image && (
          <Image
            src={user.image}
            alt={user.name ?? ""}
            width={32}
            height={32}
            className="rounded-full"
          />
        )}
        <span className="text-sm font-medium text-white/80">{user?.name}</span>
        {(user as any)?.role && (
          <span className="text-xs bg-discord-blurple/20 text-discord-blurple px-2 py-0.5 rounded-full">
            {(user as any).role}
          </span>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-white/40 hover:text-white transition-colors ml-2"
          title="Déconnexion"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}
