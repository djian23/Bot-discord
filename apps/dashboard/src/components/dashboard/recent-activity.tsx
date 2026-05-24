import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Log } from "@discord-manager/database";

const ACTION_EMOJI: Record<string, string> = {
  CART_RECEIVED: "📥",
  CART_REPOSTED: "📢",
  CART_CLAIMED: "✅",
  CART_PAID: "💰",
  CART_EXPIRED: "⏰",
  CART_CANCELLED: "❌",
  TICKET_CREATED: "🎫",
  TICKET_CLOSED: "🔒",
  USER_BLACKLISTED: "🚫",
  USER_UNBLACKLISTED: "✅",
  GIVEAWAY_CREATED: "🎁",
  GIVEAWAY_ENDED: "🏆",
};

interface RecentActivityProps {
  logs: (Log & { actor?: any })[];
}

export function RecentActivity({ logs }: RecentActivityProps) {
  return (
    <div className="bg-discord-darker border border-white/5 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
        Activité récente
      </h2>
      <div className="space-y-3">
        {logs.length === 0 && (
          <p className="text-sm text-white/30 text-center py-4">Aucune activité.</p>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3">
            <span className="text-lg shrink-0">{ACTION_EMOJI[log.action] ?? "📋"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80 truncate">{log.message ?? log.action}</p>
              {log.actor && (
                <p className="text-xs text-white/40">{log.actor.username}</p>
              )}
            </div>
            <span className="text-xs text-white/30 shrink-0">
              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: fr })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
