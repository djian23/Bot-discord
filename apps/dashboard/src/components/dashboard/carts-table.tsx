"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CART_STATUS_LABELS } from "@discord-manager/shared";

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-discord-green/20 text-discord-green",
  CLAIMED: "bg-discord-blurple/20 text-discord-blurple",
  PAID: "bg-discord-yellow/20 text-discord-yellow",
  EXPIRED: "bg-discord-red/20 text-discord-red",
  CANCELLED: "bg-white/10 text-white/40",
  SOLD_OUT: "bg-discord-fuchsia/20 text-discord-fuchsia",
};

interface CartsTableProps {
  carts: any[];
  userRole: string;
}

export function CartsTable({ carts, userRole }: CartsTableProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const canSeeCheckout = ["BOSS", "ADMIN"].includes(userRole);

  const filtered = filter === "ALL" ? carts : carts.filter((c) => c.status === filter);

  return (
    <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
      {/* Filters */}
      <div className="flex gap-2 p-4 border-b border-white/5 flex-wrap">
        {["ALL", "AVAILABLE", "CLAIMED", "PAID", "EXPIRED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full transition-colors font-medium",
              filter === s
                ? "bg-discord-blurple text-white"
                : "bg-white/5 text-white/50 hover:text-white",
            )}
          >
            {s === "ALL" ? "Tous" : CART_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-white/40 text-xs uppercase">
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Event</th>
              <th className="text-left px-4 py-3">Titre</th>
              <th className="text-left px-4 py-3">Prix</th>
              <th className="text-left px-4 py-3">Qty</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">Expiration</th>
              {canSeeCheckout && <th className="text-left px-4 py-3">Checkout</th>}
              <th className="text-left px-4 py-3">Créé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((cart) => (
              <tr key={cart.id} className="hover:bg-white/2 transition-colors">
                <td className="px-4 py-3 font-mono text-white/40 text-xs">
                  #{cart.id.slice(0, 8)}
                </td>
                <td className="px-4 py-3 text-white/70">{cart.event?.name ?? "—"}</td>
                <td className="px-4 py-3 text-white font-medium">{cart.title}</td>
                <td className="px-4 py-3 text-white/70">
                  {cart.price ? `${cart.price}€` : "—"}
                </td>
                <td className="px-4 py-3 text-white/70">{cart.quantity}</td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[cart.status])}>
                    {CART_STATUS_LABELS[cart.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/40 text-xs">
                  {cart.expirationAt
                    ? formatDistanceToNow(new Date(cart.expirationAt), { addSuffix: true, locale: fr })
                    : "—"}
                </td>
                {canSeeCheckout && (
                  <td className="px-4 py-3">
                    {cart.checkoutLink ? (
                      <a
                        href={cart.checkoutLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-discord-blurple hover:underline text-xs"
                      >
                        Voir
                      </a>
                    ) : "—"}
                  </td>
                )}
                <td className="px-4 py-3 text-white/30 text-xs">
                  {formatDistanceToNow(new Date(cart.createdAt), { addSuffix: true, locale: fr })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-white/30 text-sm py-10">Aucun cart.</p>
        )}
      </div>
    </div>
  );
}
