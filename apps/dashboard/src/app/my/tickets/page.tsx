import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@discord-manager/database";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default async function MyTicketsPage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { discordId: (session?.user as any)?.discordId ?? "" },
  });
  if (!user) redirect("/my");

  const tickets = await prisma.ticket.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      ticketCategory: true,
      _count: { select: { claims: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mes Tickets</h1>
        <p className="text-sm text-white/50 mt-1">{tickets.length} ticket(s)</p>
      </div>

      <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-white/40 text-xs uppercase">
              <th className="text-left px-4 py-3">Canal</th>
              <th className="text-left px-4 py-3">Catégorie</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">Claims</th>
              <th className="text-left px-4 py-3">Ouvert</th>
              <th className="text-left px-4 py-3">Fermé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-white/2">
                <td className="px-4 py-3 font-mono text-white/40 text-xs">
                  {ticket.discordChannelId}
                </td>
                <td className="px-4 py-3 text-white/70">
                  {ticket.ticketCategory?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      ticket.status === "OPEN"
                        ? "bg-discord-green/20 text-discord-green"
                        : ticket.status === "CLOSED"
                        ? "bg-white/10 text-white/40"
                        : "bg-discord-red/20 text-discord-red",
                    )}
                  >
                    {ticket.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/70">{ticket._count.claims}</td>
                <td className="px-4 py-3 text-white/30 text-xs">
                  {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: fr })}
                </td>
                <td className="px-4 py-3 text-white/30 text-xs">
                  {ticket.closedAt
                    ? formatDistanceToNow(new Date(ticket.closedAt), { addSuffix: true, locale: fr })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tickets.length === 0 && (
          <p className="text-center text-white/30 text-sm py-10">Aucun ticket pour le moment.</p>
        )}
      </div>
    </div>
  );
}
