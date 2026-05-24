import { prisma } from "@discord-manager/database";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default async function InvitesPage() {
  const [topInviters, recentInvites, stats] = await Promise.all([
    prisma.user.findMany({
      where: { invitesCount: { gt: 0 } },
      orderBy: { invitesCount: "desc" },
      take: 20,
    }),
    prisma.invite.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        inviter: { select: { username: true } },
        invitee: { select: { username: true } },
      },
    }),
    prisma.invite.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const statMap = Object.fromEntries(stats.map((s) => [s.status, s._count._all]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Invites</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Valid", value: statMap.VALID ?? 0, color: "text-discord-green" },
          { label: "Fake / Left", value: (statMap.FAKE ?? 0) + (statMap.LEFT ?? 0), color: "text-discord-red" },
          { label: "Total", value: Object.values(statMap).reduce((a, b) => a + b, 0), color: "text-white" },
        ].map((s) => (
          <div key={s.label} className="bg-discord-darker border border-white/5 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <div className="bg-discord-darker border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
            🏆 Leaderboard Inviteurs
          </h2>
          <div className="space-y-2">
            {topInviters.map((u, i) => (
              <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
                <span className={cn(
                  "text-sm font-bold w-6 text-center",
                  i === 0 ? "text-discord-yellow" : i === 1 ? "text-white/60" : i === 2 ? "text-discord-yellow/60" : "text-white/30"
                )}>
                  #{i + 1}
                </span>
                <span className="flex-1 text-sm text-white">{u.username}</span>
                <span className="text-sm font-bold text-discord-green">{u.invitesCount}</span>
                <span className="text-xs text-white/30">invites</span>
              </div>
            ))}
            {topInviters.length === 0 && (
              <p className="text-sm text-white/30 text-center py-4">Aucune donnée.</p>
            )}
          </div>
        </div>

        {/* Invites récentes */}
        <div className="bg-discord-darker border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
            Invites récentes
          </h2>
          <div className="space-y-2 overflow-y-auto max-h-80">
            {recentInvites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-2 text-sm">
                <span className={cn(
                  "size-2 rounded-full shrink-0",
                  inv.status === "VALID" ? "bg-discord-green" : inv.status === "LEFT" ? "bg-discord-red" : "bg-discord-yellow"
                )} />
                <span className="text-white/70">{inv.invitee.username}</span>
                <span className="text-white/30">invité par</span>
                <span className="text-white">{inv.inviter.username}</span>
                <span className="text-white/20 ml-auto text-xs">
                  {formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true, locale: fr })}
                </span>
              </div>
            ))}
            {recentInvites.length === 0 && (
              <p className="text-sm text-white/30 text-center py-4">Aucune invite.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
