import { prisma } from "@discord-manager/database";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CreateAnnouncementButton } from "@/components/forms/create-announcement-button";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-white/10 text-white/40",
  SCHEDULED: "bg-discord-yellow/20 text-discord-yellow",
  SENT: "bg-discord-green/20 text-discord-green",
  CANCELLED: "bg-discord-red/20 text-discord-red",
};

const STYLE_EMOJI: Record<string, string> = {
  HYPE: "🔥",
  PRO: "💼",
  LUXE: "💎",
  MINIMAL: "⚡",
};

export default async function AnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Annonces</h1>
          <p className="text-sm text-white/50 mt-1">{announcements.length} annonces</p>
        </div>
        <CreateAnnouncementButton />
      </div>

      <div className="space-y-3">
        {announcements.map((a) => (
          <div key={a.id} className="bg-discord-darker border border-white/5 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {a.isAiEnhanced && (
                    <span className="text-xs bg-discord-fuchsia/20 text-discord-fuchsia px-2 py-0.5 rounded-full font-medium">
                      {a.style ? STYLE_EMOJI[a.style] : "🤖"} IA {a.style}
                    </span>
                  )}
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[a.status])}>
                    {a.status}
                  </span>
                  {a.pingType && (
                    <span className="text-xs bg-discord-red/20 text-discord-red px-2 py-0.5 rounded-full">
                      @{a.pingType}
                    </span>
                  )}
                </div>
                {a.title && <p className="font-semibold text-white mt-1">{a.title}</p>}
                <p className="text-sm text-white/60 mt-1 line-clamp-2">
                  {a.finalContent ?? a.rawContent}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-white/30">
                  {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: fr })}
                </p>
                {a.sentAt && (
                  <p className="text-xs text-discord-green mt-0.5">
                    Envoyé {formatDistanceToNow(new Date(a.sentAt), { addSuffix: true, locale: fr })}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <p className="text-center text-white/30 text-sm py-10">Aucune annonce.</p>
        )}
      </div>
    </div>
  );
}
