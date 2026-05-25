import { prisma } from "@discord-manager/database";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MarkPaidButton } from "@/components/dashboard/mark-paid-button";

export default async function TicketPaymentsPage() {
  const payments = await prisma.claim.findMany({
    where: { userWantsToPay: true },
    orderBy: { userSelectedAt: "desc" },
    take: 100,
    include: {
      user: { select: { username: true } },
      cart: { include: { event: { select: { name: true } } } },
      ticket: { select: { discordChannelId: true } },
    },
  });

  const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-discord-yellow/20 text-discord-yellow",
    SELECTED_FOR_PAYMENT: "bg-discord-blurple/20 text-discord-blurple",
    PAID: "bg-discord-green/20 text-discord-green",
    CANCELLED: "bg-discord-red/20 text-discord-red",
    REFUNDED: "bg-white/10 text-white/40",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Ticket Payments</h1>
        <p className="text-sm text-white/50 mt-1">{payments.length} paiement(s) en attente</p>
      </div>

      <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-white/40 text-xs uppercase">
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Événement</th>
              <th className="text-left px-4 py-3">Panier</th>
              <th className="text-left px-4 py-3">Prix</th>
              <th className="text-left px-4 py-3">Qté</th>
              <th className="text-left px-4 py-3">Sélectionné</th>
              <th className="text-left px-4 py-3">Ticket</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {payments.map((claim) => (
              <tr key={claim.id} className="hover:bg-white/2">
                <td className="px-4 py-3 text-white/80">{claim.user.username}</td>
                <td className="px-4 py-3 text-white/70">{claim.cart.event?.name ?? "—"}</td>
                <td className="px-4 py-3 text-white/70">{claim.cart.title}</td>
                <td className="px-4 py-3 text-white/70">
                  {claim.cart.price != null ? `${claim.cart.price}€` : "—"}
                </td>
                <td className="px-4 py-3 text-white/70">{claim.cart.quantity}</td>
                <td className="px-4 py-3 text-white/30 text-xs">
                  {claim.userSelectedAt
                    ? formatDistanceToNow(new Date(claim.userSelectedAt), { addSuffix: true, locale: fr })
                    : "—"}
                </td>
                <td className="px-4 py-3 font-mono text-white/40 text-xs">
                  {claim.ticket?.discordChannelId ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      STATUS_COLORS[claim.status] ?? "bg-white/10 text-white/40",
                    )}
                  >
                    {claim.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {claim.status !== "PAID" && (
                    <MarkPaidButton claimId={claim.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && (
          <p className="text-center text-white/30 text-sm py-10">
            Aucun paiement en attente.
          </p>
        )}
      </div>
    </div>
  );
}
