import { prisma } from "@discord-manager/database";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-white/10 text-white/40",
  PUBLISHED: "bg-discord-green/20 text-discord-green",
  SOLD: "bg-discord-yellow/20 text-discord-yellow",
  ARCHIVED: "bg-white/10 text-white/40",
  EXPIRED: "bg-discord-red/20 text-discord-red",
};

export default async function AdminListingsPage() {
  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      seller: { select: { username: true } },
      event: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Listings</h1>
        <p className="text-sm text-white/50 mt-1">{listings.length} listing(s) au total</p>
      </div>

      <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-white/40 text-xs uppercase">
              <th className="text-left px-4 py-3">Vendeur</th>
              <th className="text-left px-4 py-3">Titre</th>
              <th className="text-left px-4 py-3">Événement</th>
              <th className="text-left px-4 py-3">Qté</th>
              <th className="text-left px-4 py-3">Prix</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {listings.map((listing) => (
              <tr key={listing.id} className="hover:bg-white/2">
                <td className="px-4 py-3 text-white/80">{listing.seller.username}</td>
                <td className="px-4 py-3 text-white font-medium">{listing.title}</td>
                <td className="px-4 py-3 text-white/70">{listing.event?.name ?? "—"}</td>
                <td className="px-4 py-3 text-white/70">{listing.quantity}</td>
                <td className="px-4 py-3 text-white/70">
                  {listing.priceEach != null ? `${listing.priceEach}€` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      STATUS_COLORS[listing.status] ?? "bg-white/10 text-white/40",
                    )}
                  >
                    {listing.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/30 text-xs">
                  {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true, locale: fr })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {listings.length === 0 && (
          <p className="text-center text-white/30 text-sm py-10">Aucun listing.</p>
        )}
      </div>
    </div>
  );
}
