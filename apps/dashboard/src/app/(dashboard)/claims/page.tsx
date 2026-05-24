import { prisma } from "@discord-manager/database";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ExportButton } from "@/components/ui/export-button";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-discord-yellow/20 text-discord-yellow",
  PAID: "bg-discord-green/20 text-discord-green",
  CANCELLED: "bg-discord-red/20 text-discord-red",
  REFUNDED: "bg-white/10 text-white/40",
};

export default async function ClaimsPage() {
  const claims = await prisma.claim.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
    include: {
      user: { select: { username: true, discordId: true } },
      cart: { include: { event: { select: { name: true } } } },
      ticket: { select: { discordChannelId: true } },
    },
  });

  const stats = {
    total: claims.length,
    paid: claims.filter((c) => c.status === "PAID").length,
    pending: claims.filter((c) => c.status === "PENDING").length,
    cancelled: claims.filter((c) => c.status === "CANCELLED").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Claims</h1>
          <p className="text-sm text-white/50 mt-1">{stats.total} claims chargés</p>
        </div>
        <ExportButton href="/api/export/claims" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-white" },
          { label: "Paid", value: stats.paid, color: "text-discord-green" },
          { label: "Pending", value: stats.pending, color: "text-discord-yellow" },
          { label: "Cancelled", value: stats.cancelled, color: "text-discord-red" },
        ].map((s) => (
          <div key={s.label} className="bg-discord-darker border border-white/5 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-white/40 text-xs uppercase">
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Cart</th>
              <th className="text-left px-4 py-3">Event</th>
              <th className="text-left px-4 py-3">Ticket</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {claims.map((claim) => (
              <tr key={claim.id} className="hover:bg-white/2">
                <td className="px-4 py-3">
                  <p className="text-white font-medium">{claim.user.username}</p>
                  <p className="text-xs text-white/30 font-mono">{claim.user.discordId}</p>
                </td>
                <td className="px-4 py-3 text-white/70 font-mono text-xs">#{claim.cart.id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-white/70">{claim.cart.event?.name ?? "—"}</td>
                <td className="px-4 py-3 text-white/40 font-mono text-xs">
                  {claim.ticket?.discordChannelId ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[claim.status])}>
                    {claim.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/30 text-xs">
                  {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true, locale: fr })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {claims.length === 0 && (
          <p className="text-center text-white/30 text-sm py-10">Aucun claim.</p>
        )}
      </div>
    </div>
  );
}
