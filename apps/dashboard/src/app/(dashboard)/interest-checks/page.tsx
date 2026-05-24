import { prisma } from "@discord-manager/database";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default async function InterestChecksPage() {
  const checks = await prisma.interestCheck.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      buttons: {
        include: { _count: { select: { votes: true } } },
        orderBy: { position: "asc" },
      },
      _count: { select: { votes: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Interest Checks</h1>
        <p className="text-sm text-white/50 mt-1">
          {checks.length} sondages · Créez via <code className="bg-white/10 px-1 rounded">/interest create</code>
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {checks.map((check) => {
          const total = check._count.votes;
          return (
            <div key={check.id} className={cn(
              "bg-discord-darker border rounded-xl p-5 space-y-4",
              check.isActive ? "border-discord-blurple/30" : "border-white/5 opacity-60"
            )}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-white">📊 {check.title}</h3>
                  {check.description && <p className="text-sm text-white/50 mt-0.5">{check.description}</p>}
                </div>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                  check.isActive ? "bg-discord-green/20 text-discord-green" : "bg-white/10 text-white/40"
                )}>
                  {check.isActive ? "Actif" : "Fermé"}
                </span>
              </div>

              <div className="space-y-2">
                {check.buttons.map((btn) => {
                  const pct = total > 0 ? Math.round((btn._count.votes / total) * 100) : 0;
                  return (
                    <div key={btn.id}>
                      <div className="flex justify-between text-xs text-white/60 mb-1">
                        <span>{btn.label}</span>
                        <span>{btn._count.votes} votes ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-discord-blurple rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-white/30">
                <span>{total} votes au total</span>
                <span>{formatDistanceToNow(new Date(check.createdAt), { addSuffix: true, locale: fr })}</span>
              </div>
            </div>
          );
        })}
        {checks.length === 0 && (
          <p className="col-span-2 text-center text-white/30 text-sm py-10">
            Aucun interest check.
          </p>
        )}
      </div>
    </div>
  );
}
