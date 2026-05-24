"use client";

import { cn } from "@/lib/utils";
import { Copy, ExternalLink } from "lucide-react";

interface EventsGridProps {
  events: any[];
}

const STATUS_COLORS = {
  ACTIVE: "bg-discord-green/20 text-discord-green",
  INACTIVE: "bg-white/10 text-white/40",
  ARCHIVED: "bg-discord-red/10 text-discord-red/60",
};

const MODE_LABELS = { PUBLIC: "Public", VIP: "VIP", PRIVATE: "Privé" };

export function EventsGrid({ events }: EventsGridProps) {
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="bg-discord-darker border border-white/5 rounded-xl p-5 space-y-4"
          style={{ borderLeftColor: event.embedColor, borderLeftWidth: 3 }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-white">{event.name}</h3>
              <p className="text-xs text-white/40 mt-0.5">/{event.slug}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[event.status as keyof typeof STATUS_COLORS])}>
                {event.status}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-discord-blurple/20 text-discord-blurple font-medium">
                {MODE_LABELS[event.mode as keyof typeof MODE_LABELS]}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
            {event.site && <span>Site : <span className="text-white/70">{event.site}</span></span>}
            {event.pasText && <span>PAS : <span className="text-white/70">{event.pasText}</span></span>}
            <span>Carts : <span className="text-white/70">{event._count?.carts ?? 0}</span></span>
          </div>

          {event.webhookUrl && (
            <div className="bg-black/20 rounded-lg p-2.5 flex items-center gap-2">
              <p className="text-xs text-white/30 flex-1 truncate font-mono">{event.webhookUrl.slice(0, 40)}…</p>
              <button
                onClick={() => copyToClipboard(event.webhookUrl)}
                className="text-white/40 hover:text-white transition-colors shrink-0"
                title="Copier"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
          )}

          <div className="flex gap-2 text-xs text-white/40">
            {event.sourceChannelId && <span># source</span>}
            {event.publicChannelId && <span># carts</span>}
            {event.logsChannelId && <span># logs</span>}
            {event.privateChannelId && <span># private</span>}
          </div>
        </div>
      ))}
      {events.length === 0 && (
        <p className="col-span-3 text-center text-white/30 text-sm py-10">
          Aucun event. Créez-en un via la commande <code>/event create</code>.
        </p>
      )}
    </div>
  );
}
