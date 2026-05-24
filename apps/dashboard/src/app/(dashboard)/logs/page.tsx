import { prisma } from "@discord-manager/database";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ExportButton } from "@/components/ui/export-button";

const ACTION_EMOJI: Record<string, string> = {
  CART_RECEIVED: "📥", CART_REPOSTED: "📢", CART_CLAIMED: "✅", CART_PAID: "💰",
  CART_EXPIRED: "⏰", CART_CANCELLED: "❌", TICKET_CREATED: "🎫", TICKET_CLOSED: "🔒",
  USER_BLACKLISTED: "🚫", USER_UNBLACKLISTED: "✅", GIVEAWAY_CREATED: "🎁", ERROR: "💥",
};

export default async function LogsPage() {
  const logs = await prisma.log.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: true, target: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Logs</h1>
        <ExportButton href="/api/export/logs" label="Exporter CSV" />
      </div>
      <div className="bg-discord-darker border border-white/5 rounded-xl divide-y divide-white/5">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-4 px-4 py-3">
            <span className="text-xl shrink-0">{ACTION_EMOJI[log.action] ?? "📋"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-white/5 text-white/50 px-2 py-0.5 rounded font-mono">{log.action}</span>
                {log.actor && <span className="text-xs text-white/40">par {log.actor.username}</span>}
                {log.target && <span className="text-xs text-white/40">→ {log.target.username}</span>}
              </div>
              {log.message && <p className="text-sm text-white/70 mt-0.5 truncate">{log.message}</p>}
            </div>
            <span className="text-xs text-white/30 shrink-0">
              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: fr })}
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <p className="text-center text-white/30 text-sm py-10">Aucun log.</p>
        )}
      </div>
    </div>
  );
}
