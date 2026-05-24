import { prisma } from "@discord-manager/database";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EventDetailActions } from "@/components/dashboard/actions/event-actions";
import { ArrowLeft, Copy } from "lucide-react";
import Link from "next/link";
import { CopyButton } from "@/components/ui/copy-button";

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      carts: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { claims: { include: { user: { select: { username: true } } } } },
      },
      _count: { select: { carts: true } },
    },
  });

  if (!event) notFound();

  const statusByCart = {
    AVAILABLE: event.carts.filter((c) => c.status === "AVAILABLE").length,
    CLAIMED: event.carts.filter((c) => c.status === "CLAIMED").length,
    PAID: event.carts.filter((c) => c.status === "PAID").length,
    EXPIRED: event.carts.filter((c) => c.status === "EXPIRED").length,
    CANCELLED: event.carts.filter((c) => c.status === "CANCELLED").length,
  };

  const cartColors: Record<string, string> = {
    AVAILABLE: "green", CLAIMED: "blurple", PAID: "yellow",
    EXPIRED: "red", CANCELLED: "default", SOLD_OUT: "fuchsia",
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/events" className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{event.name}</h1>
            <Badge variant={event.status === "ACTIVE" ? "green" : "default"}>{event.status}</Badge>
            <Badge variant="blurple">{event.mode}</Badge>
          </div>
          <p className="text-sm text-white/40 mt-0.5">/{event.slug}</p>
        </div>
      </div>

      {/* Infos + Webhook */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-discord-darker border border-white/5 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Infos</h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            {event.site && <><span className="text-white/40">Site</span><span className="text-white">{event.site}</span></>}
            {event.pasText && <><span className="text-white/40">PAS</span><span className="text-white">{event.pasText}</span></>}
            {event.pasAmount && <><span className="text-white/40">PAS montant</span><span className="text-white">{event.pasAmount}€</span></>}
            <span className="text-white/40">Carts total</span><span className="text-white font-bold">{event._count.carts}</span>
            <span className="text-white/40">Couleur</span>
            <span className="flex items-center gap-2">
              <span className="size-4 rounded" style={{ backgroundColor: event.embedColor }} />
              <span className="text-white font-mono text-xs">{event.embedColor}</span>
            </span>
          </div>
        </div>

        <div className="bg-discord-darker border border-white/5 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Webhook</h2>
          {event.webhookUrl ? (
            <>
              <div className="bg-black/30 rounded-lg p-3 flex items-center gap-2">
                <p className="text-xs font-mono text-white/50 flex-1 truncate">{event.webhookUrl}</p>
                <CopyButton value={event.webhookUrl} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
                <span>ID : <span className="text-white/70 font-mono">{event.webhookId}</span></span>
              </div>
            </>
          ) : (
            <p className="text-sm text-white/30">Aucun webhook configuré.</p>
          )}
        </div>
      </div>

      {/* Salons */}
      <div className="bg-discord-darker border border-white/5 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Salons Discord</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Source", id: event.sourceChannelId },
            { label: "Carts", id: event.publicChannelId },
            { label: "Logs", id: event.logsChannelId },
            { label: "Private", id: event.privateChannelId },
          ].map(({ label, id }) => (
            <div key={label} className={cn("rounded-lg p-3 text-center", id ? "bg-discord-blurple/10 border border-discord-blurple/20" : "bg-white/5 border border-white/5 opacity-40")}>
              <p className="text-xs text-white/50">{label}</p>
              <p className="text-xs font-mono text-white mt-1 truncate">{id ?? "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats carts */}
      <div className="grid grid-cols-5 gap-3">
        {Object.entries(statusByCart).map(([status, count]) => (
          <div key={status} className="bg-discord-darker border border-white/5 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-white">{count}</p>
            <p className="text-xs text-white/40 mt-0.5">{status}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <EventDetailActions event={event} />

      {/* Liste carts */}
      <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="font-semibold text-white">Carts récents ({event.carts.length})</h2>
        </div>
        <div className="divide-y divide-white/5">
          {event.carts.map((cart) => (
            <div key={cart.id} className="flex items-center gap-4 px-4 py-3">
              {cart.image && <img src={cart.image} alt="" className="size-8 rounded object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{cart.title}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-white/40">
                  {cart.price && <span>{cart.price}€</span>}
                  {cart.quantity > 1 && <span>x{cart.quantity}</span>}
                  {cart.section && <span>{cart.section}</span>}
                </div>
              </div>
              <Badge variant={cartColors[cart.status] as any}>{cart.status}</Badge>
              {cart.claims[0] && (
                <span className="text-xs text-white/40">
                  → {cart.claims[0].user.username}
                </span>
              )}
              <span className="text-xs text-white/30 shrink-0">
                {formatDistanceToNow(new Date(cart.createdAt), { addSuffix: true, locale: fr })}
              </span>
            </div>
          ))}
          {event.carts.length === 0 && (
            <p className="text-sm text-white/30 text-center py-6">Aucun cart.</p>
          )}
        </div>
      </div>
    </div>
  );
}
