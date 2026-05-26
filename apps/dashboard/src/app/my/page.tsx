import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@discord-manager/database";
import { StatCard } from "@/components/dashboard/stat-card";
import { ShoppingCart, DollarSign, Ticket, Tag } from "lucide-react";

export default async function MyDashboardPage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { discordId: getSessionUser(session)?.discordId ?? "" },
  });
  if (!user) redirect("/login");

  const [totalClaims, paidClaims, openTickets, totalListings] = await Promise.all([
    prisma.claim.count({ where: { userId: user.id } }),
    prisma.claim.count({ where: { userId: user.id, status: "PAID" } }),
    prisma.ticket.count({ where: { userId: user.id, status: "OPEN" } }),
    prisma.listing.count({ where: { sellerId: user.id } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bonjour, {user.username} 👋</h1>
        <p className="text-sm text-white/50 mt-1">Voici un aperçu de ton espace personnel.</p>
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
          value={paidClaims}
          icon={<DollarSign className="size-5" />}
          color="green"
        />
        <StatCard
          title="Tickets ouverts"
          value={openTickets}
          icon={<Ticket className="size-5" />}
          color="yellow"
        />
        <StatCard
          title="Listings"
          value={totalListings}
          icon={<Tag className="size-5" />}
          color="fuchsia"
        />
      </div>
    </div>
  );
}
