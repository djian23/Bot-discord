import { prisma } from "@discord-manager/database";
import { LiveOverview } from "@/components/dashboard/live-overview";
import { LiveActivity } from "@/components/dashboard/live-activity";
import { BotStatus } from "@/components/dashboard/bot-status";

async function getStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [cartsToday, claimsToday, paidToday, openTickets, recentLogs, topEvents] = await Promise.all([
    prisma.cart.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.claim.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.claim.count({ where: { status: "PAID", createdAt: { gte: todayStart } } }),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.log.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { username: true } } },
    }),
    prisma.event.findMany({
      where: { status: "ACTIVE" },
      include: { _count: { select: { carts: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return { cartsToday, claimsToday, paidToday, openTickets, recentLogs, topEvents };
}

export default async function OverviewPage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-sm text-white/50 mt-1">Tableau de bord en temps réel</p>
      </div>

      <LiveOverview
        initial={{
          cartsToday: stats.cartsToday,
          claimsToday: stats.claimsToday,
          paidToday: stats.paidToday,
          openTickets: stats.openTickets,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveActivity initialLogs={stats.recentLogs} />
        </div>
        <div className="space-y-4">
          <BotStatus />
          <div className="bg-discord-darker border border-white/5 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Events actifs</h2>
            <div className="space-y-2">
              {stats.topEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-3">
                  <div
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: e.embedColor }}
                  />
                  <span className="flex-1 text-sm text-white truncate">{e.name}</span>
                  <span className="text-xs text-white/40">{e._count.carts} carts</span>
                </div>
              ))}
              {stats.topEvents.length === 0 && (
                <p className="text-sm text-white/30">Aucun event actif.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
