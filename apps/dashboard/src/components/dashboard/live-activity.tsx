"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const ACTION_EMOJI: Record<string, string> = {
  "cart:new": "📥",
  "cart:claimed": "✅",
  "cart:paid": "💰",
  "cart:expired": "⏰",
  "ticket:created": "🎫",
  "ticket:closed": "🔒",
};

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
}

interface LiveActivityProps {
  initialLogs: { id: string; action: string; message: string | null; createdAt: Date; actor?: { username: string } | null }[];
}

export function LiveActivity({ initialLogs }: LiveActivityProps) {
  const [activities, setActivities] = useState<Activity[]>(
    initialLogs.map((l) => ({
      id: l.id,
      type: l.action,
      message: l.message ?? l.action,
      timestamp: new Date(l.createdAt),
    })),
  );
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";
    const socket = io(wsUrl, { transports: ["websocket"] });
    socketRef.current = socket;

    const events = ["cart:new", "cart:claimed", "cart:paid", "cart:expired", "ticket:created", "ticket:closed"] as const;

    const labels: Record<string, string> = {
      "cart:new": "Nouveau cart reçu",
      "cart:claimed": "Cart claim",
      "cart:paid": "Cart payé",
      "cart:expired": "Cart expiré",
      "ticket:created": "Ticket créé",
      "ticket:closed": "Ticket fermé",
    };

    for (const event of events) {
      socket.on(event, () => {
        const newActivity: Activity = {
          id: Math.random().toString(36).slice(2),
          type: event,
          message: labels[event],
          timestamp: new Date(),
        };
        setActivities((prev) => [newActivity, ...prev].slice(0, 20));
      });
    }

    return () => socket.disconnect();
  }, []);

  return (
    <div className="bg-discord-darker border border-white/5 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Activité récente</h2>
        <span className="flex items-center gap-1.5 text-xs text-discord-green">
          <span className="size-1.5 rounded-full bg-discord-green animate-pulse" />
          Live
        </span>
      </div>
      <div className="space-y-3">
        {activities.map((a) => (
          <div key={a.id} className="flex items-start gap-3">
            <span className="text-lg shrink-0">{ACTION_EMOJI[a.type] ?? "📋"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80 truncate">{a.message}</p>
            </div>
            <span className="text-xs text-white/30 shrink-0">
              {formatDistanceToNow(a.timestamp, { addSuffix: true, locale: fr })}
            </span>
          </div>
        ))}
        {activities.length === 0 && (
          <p className="text-sm text-white/30 text-center py-4">En attente d'activité…</p>
        )}
      </div>
    </div>
  );
}
