import { prisma } from "@discord-manager/database";
import { formatDistanceToNow, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { CreateGiveawayButton } from "@/components/forms/create-giveaway-button";
import { GiveawayActions } from "@/components/dashboard/actions/giveaway-actions";

export default async function GiveawaysPage() {
  const giveaways = await prisma.giveaway.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      _count: { select: { entries: true, winners: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Giveaways</h1>
          <p className="text-sm text-white/50 mt-1">{giveaways.length} giveaways</p>
        </div>
        <CreateGiveawayButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {giveaways.map((g) => {
          const ended = g.status === "ENDED" || g.status === "CANCELLED" || isPast(new Date(g.endsAt));
          return (
            <div key={g.id} className={cn(
              "bg-discord-darker border rounded-xl p-5 space-y-3",
              ended ? "border-white/5 opacity-70" : "border-discord-blurple/30"
            )}>
              <div className="flex items-start justify-between gap-2">
                <Link href={`/giveaways/${g.id}`} className="font-semibold text-white hover:text-discord-blurple transition-colors">
                  🎁 {g.title}
                </Link>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                  g.status === "ACTIVE" ? "bg-discord-green/20 text-discord-green" :
                  g.status === "ENDED" ? "bg-discord-yellow/20 text-discord-yellow" :
                  "bg-white/10 text-white/40"
                )}>{g.status}</span>
              </div>

              {g.description && <p className="text-sm text-white/50">{g.description}</p>}

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-black/20 rounded-lg p-2">
                  <p className="text-lg font-bold text-white">{g._count.entries}</p>
                  <p className="text-xs text-white/40">Participants</p>
                </div>
                <div className="bg-black/20 rounded-lg p-2">
                  <p className="text-lg font-bold text-discord-green">{g._count.winners}</p>
                  <p className="text-xs text-white/40">Gagnants</p>
                </div>
                <div className="bg-black/20 rounded-lg p-2">
                  <p className="text-lg font-bold text-discord-blurple">{g.winnersCount}</p>
                  <p className="text-xs text-white/40">Prix</p>
                </div>
              </div>

              <p className="text-xs text-white/30">
                {ended
                  ? `Terminé ${formatDistanceToNow(new Date(g.endsAt), { addSuffix: true, locale: fr })}`
                  : `Fin ${formatDistanceToNow(new Date(g.endsAt), { addSuffix: true, locale: fr })}`}
              </p>

              <GiveawayActions giveawayId={g.id} status={g.status} />
            </div>
          );
        })}
        {giveaways.length === 0 && (
          <p className="col-span-3 text-center text-white/30 text-sm py-10">
            Aucun giveaway. Utilisez <code>/giveaway create</code> dans Discord.
          </p>
        )}
      </div>
    </div>
  );
}
