import { prisma } from "@discord-manager/database";
import { notFound } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TicketActions } from "@/components/dashboard/actions/ticket-actions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      closedBy: { select: { username: true } },
      claims: {
        orderBy: { createdAt: "desc" },
        include: {
          cart: { include: { event: { select: { name: true } } } },
        },
      },
      messages: { orderBy: { createdAt: "asc" } },
      staffNotes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!ticket) notFound();

  const claimColors: Record<string, string> = {
    PENDING: "yellow",
    PAID: "green",
    CANCELLED: "red",
    REFUNDED: "default",
  };

  const cartStatusColors: Record<string, string> = {
    AVAILABLE: "green",
    CLAIMED: "blurple",
    PAID: "yellow",
    EXPIRED: "red",
    CANCELLED: "default",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/tickets" className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Ticket #{ticket.id.slice(0, 8)}</h1>
          <p className="text-sm text-white/40 mt-0.5">
            <Link href={`/users/${ticket.user.id}`} className="hover:text-discord-blurple transition-colors">
              {ticket.user.username}
            </Link>
            {" · "}
            <span className="font-mono">{ticket.discordChannelId}</span>
          </p>
        </div>
        <Badge variant={ticket.status === "OPEN" ? "green" : "default"}>{ticket.status}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-discord-darker border border-white/5 rounded-xl p-4">
          <p className="text-white/40 text-xs mb-1">Ouvert le</p>
          <p className="text-white">{format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm")}</p>
        </div>
        <div className="bg-discord-darker border border-white/5 rounded-xl p-4">
          <p className="text-white/40 text-xs mb-1">Carts</p>
          <p className="text-white font-bold text-xl">{ticket.claims.length}</p>
        </div>
        <div className="bg-discord-darker border border-white/5 rounded-xl p-4">
          <p className="text-white/40 text-xs mb-1">Fermé par</p>
          <p className="text-white">{ticket.closedBy?.username ?? (ticket.status === "OPEN" ? "—" : "Système")}</p>
        </div>
      </div>

      {/* Actions */}
      {ticket.status === "OPEN" && <TicketActions ticketId={ticket.id} />}

      {/* Claims */}
      <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="font-semibold text-white">Carts dans ce ticket</h2>
        </div>
        <div className="divide-y divide-white/5">
          {ticket.claims.map((claim) => (
            <div key={claim.id} className="flex items-center gap-4 px-4 py-3">
              {claim.cart.image && (
                <img src={claim.cart.image} alt="" className="size-10 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{claim.cart.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-white/40">{claim.cart.event?.name ?? "—"}</span>
                  {claim.cart.price && <span className="text-xs text-white/60">{claim.cart.price}€</span>}
                  {claim.cart.quantity && <span className="text-xs text-white/40">x{claim.cart.quantity}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge variant={claimColors[claim.status] as any}>{claim.status}</Badge>
                <Badge variant={cartStatusColors[claim.cart.status] as any}>{claim.cart.status}</Badge>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-white/30">
                  {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true, locale: fr })}
                </p>
              </div>
            </div>
          ))}
          {ticket.claims.length === 0 && (
            <p className="text-sm text-white/30 text-center py-6">Aucun cart.</p>
          )}
        </div>
      </div>

      {/* Notes staff */}
      {ticket.staffNotes.length > 0 && (
        <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white">Notes staff</h2>
          </div>
          <div className="divide-y divide-white/5">
            {ticket.staffNotes.map((note) => (
              <div key={note.id} className="px-4 py-3">
                <p className="text-sm text-white/80">{note.content}</p>
                <p className="text-xs text-white/30 mt-1">{format(new Date(note.createdAt), "dd/MM/yyyy HH:mm")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages / Logs */}
      {ticket.messages.length > 0 && (
        <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white">Historique ({ticket.messages.length} messages)</h2>
          </div>
          <div className="divide-y divide-white/5 max-h-60 overflow-y-auto">
            {ticket.messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-3 px-4 py-2.5", msg.isStaff && "bg-discord-blurple/5")}>
                {msg.isStaff && <span className="text-xs bg-discord-blurple/20 text-discord-blurple px-1.5 py-0.5 rounded self-start shrink-0">Staff</span>}
                <p className="text-sm text-white/70 flex-1">{msg.content}</p>
                <p className="text-xs text-white/30 shrink-0">{format(new Date(msg.createdAt), "HH:mm")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {ticket.transcriptUrl && (
        <div className="bg-discord-green/5 border border-discord-green/20 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">📄</span>
          <div>
            <p className="text-sm font-medium text-discord-green">Transcript disponible</p>
            <p className="text-xs text-white/40">Généré à la fermeture du ticket</p>
          </div>
        </div>
      )}
    </div>
  );
}
