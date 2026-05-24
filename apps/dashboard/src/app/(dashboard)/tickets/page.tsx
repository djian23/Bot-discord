import { prisma } from "@discord-manager/database";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function TicketsPage() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: true,
      _count: { select: { claims: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Tickets</h1>
      <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-white/40 text-xs uppercase">
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Carts</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">Canal</th>
              <th className="text-left px-4 py-3">Créé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-white/2">
                <td className="px-4 py-3 font-mono text-white/40 text-xs">
                  <Link href={`/tickets/${ticket.id}`} className="hover:text-discord-blurple transition-colors">
                    #{ticket.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/users/${ticket.user.id}`} className="text-white hover:text-discord-blurple transition-colors">
                    {ticket.user.username}
                  </Link>
                </td>
                <td className="px-4 py-3 text-white/70">{ticket._count.claims}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    ticket.status === "OPEN" ? "bg-discord-green/20 text-discord-green" : "bg-white/10 text-white/40"
                  )}>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-white/40 text-xs">{ticket.discordChannelId}</td>
                <td className="px-4 py-3 text-white/30 text-xs">
                  {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: fr })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tickets.length === 0 && (
          <p className="text-center text-white/30 text-sm py-10">Aucun ticket.</p>
        )}
      </div>
    </div>
  );
}
