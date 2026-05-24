import { prisma } from "@discord-manager/database";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { BotStatus } from "@/components/dashboard/bot-status";
import { ShoppingCart, CheckCircle, CreditCard, Ticket } from "lucide-react";

async function getStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [cartsToday, claimsToday, paidToday, openTickets, recentLogs] = await Promise.all([
    prisma.cart.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.claim.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.claim.count({ where: { status: "PAID", createdAt: { gte: todayStart } } }),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.log.findMany({ take: 10, orderBy: { createdAt: "desc" }, include: { actor: true } }),
  ]);

  return { cartsToday, claimsToday, paidToday, openTickets, recentLogs };
}

export default async function OverviewPage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-sm text-white/50 mt-1">Activité du jour</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Carts reçus"
          value={stats.cartsToday}
          icon={<ShoppingCart className="size-5" />}
          color="blurple"
        />
        <StatCard
          title="Claims"
          value={stats.claimsToday}
          icon={<CheckCircle className="size-5" />}
          color="green"
        />
        <StatCard
          title="Paid"
          value={stats.paidToday}
          icon={<CreditCard className="size-5" />}
          color="yellow"
        />
        <StatCard
          title="Tickets ouverts"
          value={stats.openTickets}
          icon={<Ticket className="size-5" />}
          color="fuchsia"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity logs={stats.recentLogs} />
        </div>
        <div>
          <BotStatus />
        </div>
      </div>
    </div>
  );
}
