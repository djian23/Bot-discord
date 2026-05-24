import { prisma } from "@discord-manager/database";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { ExportButton } from "@/components/ui/export-button";

async function getAnalyticsData() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    topUsers,
    topEvents,
    claimsByDay,
    totalCarts,
    totalClaims,
    totalPaid,
    totalCancelled,
  ] = await Promise.all([
    prisma.user.findMany({
      orderBy: { claimsCount: "desc" },
      take: 5,
      select: { username: true, claimsCount: true, paidCount: true, invitesCount: true },
    }),
    prisma.event.findMany({
      include: { _count: { select: { carts: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.dailyStats.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      orderBy: { date: "asc" },
    }),
    prisma.cart.count(),
    prisma.claim.count(),
    prisma.claim.count({ where: { status: "PAID" } }),
    prisma.claim.count({ where: { status: "CANCELLED" } }),
  ]);

  const conversionRate = totalClaims > 0 ? Math.round((totalPaid / totalClaims) * 100) : 0;

  return { topUsers, topEvents, claimsByDay, totalCarts, totalClaims, totalPaid, totalCancelled, conversionRate };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <ExportButton href="/api/export/analytics" label="Exporter 90j CSV" />
      </div>
      <AnalyticsCharts data={data} />
    </div>
  );
}
