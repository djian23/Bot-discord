"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CART_STATUS_LABELS } from "@discord-manager/shared";
import { CartRowActions } from "./cart-row-actions";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  events: { id: string; name: string }[];
  currentStatus: string;
  currentEventId?: string;
  page: number;
  totalPages: number;
  total: number;
}

export function CartsTable({ carts, userRole, events, currentStatus, currentEventId, page, totalPages, total }: CartsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canSeeCheckout = ["BOSS", "ADMIN"].includes(userRole);

  const refresh = useCallback(() => router.refresh(), [router]);

  function navigate(params: Record<string, string | undefined>, keepPage = false) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    if (!keepPage) sp.delete("page");
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex gap-2 flex-wrap">
          {["ALL", "AVAILABLE", "CLAIMED", "PAID", "EXPIRED", "CANCELLED"].map((s) => (
            <button
              key={s}
              onClick={() => navigate({ status: s === "ALL" ? undefined : s })}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full transition-colors font-medium",
                currentStatus === s || (s === "ALL" && !currentStatus)
                  ? "bg-discord-blurple text-white"
                  : "bg-white/5 text-white/50 hover:text-white",
              )}
            >
              {s === "ALL" ? "Tous" : CART_STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <select
          value={currentEventId ?? ""}
          onChange={(e) => navigate({ event: e.target.value || undefined })}
          className="ml-auto text-xs bg-discord-dark border border-white/10 text-white/70 rounded-lg px-3 py-1.5 focus:outline-none focus:border-discord-blurple"
        >
          <option value="">Tous les events</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
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
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {carts.map((cart) => (
                <tr key={cart.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-white/40 text-xs">#{cart.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-white/70">{cart.event?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-white font-medium">{cart.title}</td>
                  <td className="px-4 py-3 text-white/70">{cart.price ? `${cart.price}€` : "—"}</td>
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
                        <a href={cart.checkoutLink} target="_blank" rel="noopener noreferrer" className="text-discord-blurple hover:underline text-xs">
                          Voir
                        </a>
                      ) : "—"}
                    </td>
                  )}
                  <td className="px-4 py-3 text-white/30 text-xs">
                    {formatDistanceToNow(new Date(cart.createdAt), { addSuffix: true, locale: fr })}
                  </td>
                  <td className="px-4 py-3">
                    <CartRowActions cartId={cart.id} status={cart.status} onRefresh={refresh} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {carts.length === 0 && (
            <p className="text-center text-white/30 text-sm py-10">Aucun cart.</p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <span className="text-xs text-white/40">{total} résultats · page {page}/{totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => navigate({ page: String(page - 1) }, true)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => navigate({ page: String(page + 1) }, true)}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
