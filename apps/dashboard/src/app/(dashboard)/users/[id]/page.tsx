import { prisma } from "@discord-manager/database";
import { notFound } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { UserActions } from "@/components/dashboard/actions/user-actions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      claims: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          cart: { include: { event: { select: { name: true } } } },
          ticket: { select: { id: true, discordChannelId: true } },
        },
      },
      tickets: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { _count: { select: { claims: true } } },
      },
      staffNotes: {
        orderBy: { createdAt: "desc" },
        include: { author: false },
      },
      invitesSent: {
        where: { status: "VALID" },
        include: { invitee: { select: { username: true } } },
        take: 10,
      },
    },
  });

  if (!user) notFound();

  const claimStatusColors: Record<string, string> = {
    PENDING: "yellow",
    PAID: "green",
    CANCELLED: "red",
    REFUNDED: "default",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/users" className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{user.username}</h1>
          <p className="text-sm text-white/40 font-mono mt-0.5">{user.discordId}</p>
        </div>
        {user.isBlacklisted && <Badge variant="red">BLACKLISTÉ</Badge>}
        <Badge variant="blurple">{user.role}</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Claims", value: user.claimsCount, color: "text-white" },
          { label: "Paid", value: user.paidCount, color: "text-discord-green" },
          { label: "Cancelled", value: user.cancelledCount, color: "text-discord-red" },
          { label: "Invites", value: user.invitesCount, color: "text-discord-blurple" },
        ].map((s) => (
          <div key={s.label} className="bg-discord-darker border border-white/5 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions staff */}
      <UserActions user={user} />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Historique claims */}
        <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white">Claims ({user.claims.length})</h2>
          </div>
          <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
            {user.claims.map((claim) => (
              <div key={claim.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{claim.cart.title}</p>
                  <p className="text-xs text-white/40">{claim.cart.event?.name ?? "—"}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant={claimStatusColors[claim.status] as any}>{claim.status}</Badge>
                  <p className="text-xs text-white/30 mt-0.5">
                    {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true, locale: fr })}
                  </p>
                </div>
              </div>
            ))}
            {user.claims.length === 0 && (
              <p className="text-sm text-white/30 text-center py-6">Aucun claim.</p>
            )}
          </div>
        </div>

        {/* Tickets */}
        <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white">Tickets ({user.tickets.length})</h2>
          </div>
          <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
            {user.tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-white/60">{ticket.discordChannelId}</p>
                  <p className="text-xs text-white/40">{ticket._count.claims} carts</p>
                </div>
                <Badge variant={ticket.status === "OPEN" ? "green" : "default"}>{ticket.status}</Badge>
              </Link>
            ))}
            {user.tickets.length === 0 && (
              <p className="text-sm text-white/30 text-center py-6">Aucun ticket.</p>
            )}
          </div>
        </div>

        {/* Notes staff */}
        <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white">Notes staff ({user.staffNotes.length})</h2>
          </div>
          <div className="divide-y divide-white/5 max-h-60 overflow-y-auto">
            {user.staffNotes.map((note) => (
              <div key={note.id} className="px-4 py-3">
                <p className="text-sm text-white/80">{note.content}</p>
                <p className="text-xs text-white/30 mt-1">
                  {format(new Date(note.createdAt), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            ))}
            {user.staffNotes.length === 0 && (
              <p className="text-sm text-white/30 text-center py-6">Aucune note.</p>
            )}
          </div>
        </div>

        {/* Invites envoyées */}
        <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white">Invites envoyées ({user.invitesCount})</h2>
          </div>
          <div className="divide-y divide-white/5 max-h-60 overflow-y-auto">
            {user.invitesSent.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                <span className="size-2 rounded-full bg-discord-green shrink-0" />
                <span className="text-sm text-white">{inv.invitee.username}</span>
                <span className="text-xs text-white/30 ml-auto">
                  {formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true, locale: fr })}
                </span>
              </div>
            ))}
            {user.invitesSent.length === 0 && (
              <p className="text-sm text-white/30 text-center py-6">Aucune invite.</p>
            )}
          </div>
        </div>
      </div>

      <div className="text-xs text-white/20">
        Membre depuis {format(new Date(user.createdAt), "dd MMMM yyyy", { locale: fr })} ·
        Max claims/jour : {user.maxClaimsPerDay} ·
        Dernier claim : {user.lastClaimAt ? formatDistanceToNow(new Date(user.lastClaimAt), { addSuffix: true, locale: fr }) : "jamais"}
      </div>
    </div>
  );
}
