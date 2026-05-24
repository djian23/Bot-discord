import { prisma } from "@discord-manager/database";
import { notFound } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Trophy, Users, Clock } from "lucide-react";
import { GiveawayActions } from "@/components/dashboard/actions/giveaway-actions";

export default async function GiveawayDetailPage({ params }: { params: { id: string } }) {
  const giveaway = await prisma.giveaway.findUnique({
    where: { id: params.id },
    include: {
      entries: {
        include: { user: { select: { username: true, discordId: true, claimsCount: true } } },
        orderBy: { createdAt: "asc" },
      },
      winners: {
        include: { user: { select: { username: true, discordId: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!giveaway) notFound();

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-discord-green/20 text-discord-green",
    ENDED: "bg-discord-yellow/20 text-discord-yellow",
    CANCELLED: "bg-white/10 text-white/40",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/giveaways" className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">🎁 {giveaway.title}</h1>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColors[giveaway.status] ?? "bg-white/10 text-white/40")}>
              {giveaway.status}
            </span>
          </div>
          {giveaway.description && <p className="text-sm text-white/50 mt-1">{giveaway.description}</p>}
        </div>
        <GiveawayActions giveawayId={giveaway.id} status={giveaway.status} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Participants", value: giveaway.entries.length, color: "text-discord-blurple" },
          { icon: Trophy, label: "Gagnants tirés", value: giveaway.winners.length, color: "text-discord-yellow" },
          { icon: Trophy, label: "Prix à gagner", value: giveaway.winnersCount, color: "text-discord-green" },
          { icon: Clock, label: giveaway.status === "ACTIVE" ? "Fin dans" : "Terminé", value: formatDistanceToNow(new Date(giveaway.endsAt), { locale: fr }), color: "text-white" },
        ].map((s) => (
          <div key={s.label} className="bg-discord-darker border border-white/5 rounded-xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Winners */}
        <div className="bg-discord-darker border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Trophy className="size-4 text-discord-yellow" />
            Gagnants ({giveaway.winners.length})
          </h2>
          {giveaway.winners.length > 0 ? (
            <div className="space-y-2">
              {giveaway.winners.map((w, i) => (
                <div key={w.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-discord-yellow/5 border border-discord-yellow/10">
                  <span className="text-discord-yellow font-bold text-sm">#{i + 1}</span>
                  <span className="flex-1 text-sm text-white font-medium">{(w as any).user?.username ?? w.userId}</span>
                  <span className="text-xs text-white/30 font-mono">{(w as any).user?.discordId ?? ""}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/30 text-center py-6">
              {giveaway.status === "ACTIVE" ? "Le tirage n\'a pas encore eu lieu." : "Aucun participant au moment du tirage."}
            </p>
          )}
        </div>

        {/* Participants */}
        <div className="bg-discord-darker border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users className="size-4" />
            Participants ({giveaway.entries.length})
          </h2>
          <div className="space-y-1 overflow-y-auto max-h-80">
            {giveaway.entries.map((entry) => {
              const isWinner = giveaway.winners.some((w) => w.userId === entry.userId);
              return (
                <div key={entry.id} className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
                  isWinner ? "bg-discord-yellow/5 border border-discord-yellow/10" : "hover:bg-white/5"
                )}>
                  {isWinner && <Trophy className="size-3.5 text-discord-yellow shrink-0" />}
                  <span className={cn("flex-1", isWinner ? "text-discord-yellow font-medium" : "text-white/70")}>
                    {entry.user.username}
                  </span>
                  <span className="text-xs text-white/30">{entry.user.claimsCount} claims</span>
                  <span className="text-xs text-white/20">
                    {format(new Date(entry.createdAt), "HH:mm dd/MM", { locale: fr })}
                  </span>
                </div>
              );
            })}
            {giveaway.entries.length === 0 && (
              <p className="text-sm text-white/30 text-center py-6">Aucun participant.</p>
            )}
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="bg-discord-darker border border-white/5 rounded-xl p-4 flex flex-wrap gap-4 text-xs text-white/40">
        <span>ID : <span className="font-mono text-white/60">{giveaway.id}</span></span>
        <span>Salon : <span className="text-white/60">#{giveaway.channelId}</span></span>
        <span>Créé : <span className="text-white/60">{format(new Date(giveaway.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}</span></span>
        {giveaway.endedAt && <span>Terminé : <span className="text-white/60">{format(new Date(giveaway.endedAt), "dd/MM/yyyy HH:mm", { locale: fr })}</span></span>}
        {giveaway.minClaims > 0 && <span>Min claims requis : <span className="text-white/60">{giveaway.minClaims}</span></span>}
        {giveaway.requiredRoleId && <span>Rôle requis : <span className="text-white/60">{giveaway.requiredRoleId}</span></span>}
      </div>
    </div>
  );
}
