import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@discord-manager/database";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-discord-yellow/20 text-discord-yellow",
  SELECTED_FOR_PAYMENT: "bg-discord-blurple/20 text-discord-blurple",
  PAID: "bg-discord-green/20 text-discord-green",
  CANCELLED: "bg-discord-red/20 text-discord-red",
  REFUNDED: "bg-white/10 text-white/40",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  SELECTED_FOR_PAYMENT: "Sélectionné",
  PAID: "Payé",
  CANCELLED: "Annulé",
  REFUNDED: "Remboursé",
};

export default async function MyClaimsPage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { discordId: (session?.user as any)?.discordId ?? "" },
  });
  if (!user) redirect("/my");

  const claims = await prisma.claim.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      cart: { include: { event: { select: { name: true } } } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mes Claims</h1>
        <p className="text-sm text-white/50 mt-1">{claims.length} claim(s) trouvé(s)</p>
      </div>

      <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-white/40 text-xs uppercase">
              <th className="text-left px-4 py-3">Événement</th>
              <th className="text-left px-4 py-3">Panier</th>
              <th className="text-left px-4 py-3">Prix</th>
              <th className="text-left px-4 py-3">PAS</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {claims.map((claim) => (
              <tr key={claim.id} className="hover:bg-white/2">
                <td className="px-4 py-3 text-white/80">{claim.cart.event?.name ?? "—"}</td>
                <td className="px-4 py-3 text-white/70">{claim.cart.title}</td>
                <td className="px-4 py-3 text-white/70">
                  {claim.cart.price != null ? `${claim.cart.price}€` : "—"}
                </td>
                <td className="px-4 py-3 text-white/40 text-xs font-mono">
                  {claim.cart.quantity ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      STATUS_COLORS[claim.status] ?? "bg-white/10 text-white/40",
                    )}
                  >
                    {STATUS_LABELS[claim.status] ?? claim.status}
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
          <p className="text-center text-white/30 text-sm py-10">Aucun claim pour le moment.</p>
        )}
      </div>
    </div>
  );
}
