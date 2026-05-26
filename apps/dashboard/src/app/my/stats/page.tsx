import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@discord-manager/database";
import { StatCard } from "@/components/dashboard/stat-card";
import { ShoppingCart, DollarSign, XCircle, TrendingUp } from "lucide-react";

export default async function MyStatsPage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { discordId: getSessionUser(session)?.discordId ?? "" },
  });
  if (!user) redirect("/my");

  const claims = await prisma.claim.findMany({
    where: { userId: user.id },
    include: { cart: { include: { event: { select: { name: true } } } } },
  });

  const totalClaims = claims.length;
  const totalPaid = claims.filter((c) => c.status === "PAID").length;
  const totalCancelled = claims.filter((c) => c.status === "CANCELLED").length;
  const totalSpent = claims
    .filter((c) => c.status === "PAID")
    .reduce((acc, c) => acc + (c.cart.price ?? 0), 0);

  // Best event (most claims)
  const eventCounts: Record<string, { name: string; count: number }> = {};
  for (const claim of claims) {
    const name = claim.cart.event?.name ?? "Inconnu";
    const eventId = claim.cart.eventId;
    if (!eventCounts[eventId]) eventCounts[eventId] = { name, count: 0 };
    eventCounts[eventId].count++;
  }
  const topEvents = Object.values(eventCounts).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mes Stats</h1>
        <p className="text-sm text-white/50 mt-1">Vue d'ensemble de ton activité</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Claims"
          value={totalClaims}
          icon={<ShoppingCart className="size-5" />}
          color="blurple"
        />
        <StatCard
          title="Claims Payés"
          value={totalPaid}
          icon={<DollarSign className="size-5" />}
          color="green"
        />
        <StatCard
          title="Claims Annulés"
          value={totalCancelled}
          icon={<XCircle className="size-5" />}
          color="red"
        />
        <StatCard
          title="Total Dépensé"
          value={`${totalSpent.toFixed(0)}€`}
          icon={<TrendingUp className="size-5" />}
          color="yellow"
        />
      </div>

      {topEvents.length > 0 && (
        <div className="bg-discord-darker border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-4">
            Top Événements
          </h2>
          <div className="space-y-3">
            {topEvents.map((ev, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-white/80 text-sm">{ev.name}</span>
                <span className="text-discord-blurple text-sm font-bold">{ev.count} claim(s)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
