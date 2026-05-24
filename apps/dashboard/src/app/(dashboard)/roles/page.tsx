import { prisma } from "@discord-manager/database";
import { cn } from "@/lib/utils";

export default async function RolesPage() {
  const panels = await prisma.rolePanel.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      options: { orderBy: { createdAt: "asc" } },
      _count: { select: { options: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Panels de rôles</h1>
        <p className="text-sm text-white/50 mt-1">
          {panels.length} panels · Créez-en via <code className="bg-white/10 px-1 rounded">/role panel</code>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {panels.map((panel) => (
          <div key={panel.id} className={cn(
            "bg-discord-darker border rounded-xl p-5 space-y-4",
            panel.isActive ? "border-discord-blurple/30" : "border-white/5 opacity-60"
          )}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{panel.name}</h3>
                <p className="text-xs text-white/40 font-mono mt-0.5">{panel.id.slice(0, 12)}</p>
              </div>
              <div className="flex gap-1">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  panel.isActive ? "bg-discord-green/20 text-discord-green" : "bg-white/10 text-white/40"
                )}>
                  {panel.isActive ? "Actif" : "Inactif"}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-discord-blurple/20 text-discord-blurple">
                  {panel.type}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {panel.options.map((opt) => (
                <div key={opt.id} className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                  {opt.emoji && <span>{opt.emoji}</span>}
                  <span className="text-sm text-white flex-1">{opt.label}</span>
                  <span className="text-xs text-white/30 font-mono">{opt.roleId.slice(-6)}</span>
                  {opt.minClaims && (
                    <span className="text-xs bg-discord-blurple/20 text-discord-blurple px-1.5 rounded">
                      {opt.minClaims}c
                    </span>
                  )}
                  {opt.manualOnly && (
                    <span className="text-xs bg-discord-red/20 text-discord-red px-1.5 rounded">Manuel</span>
                  )}
                </div>
              ))}
              {panel.options.length === 0 && (
                <p className="text-xs text-white/30 text-center py-2">
                  Aucun rôle. Utilisez <code>/role add</code>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-white/30">
              <span>Canal : <span className="font-mono">{panel.channelId}</span></span>
              {panel.messageId && <span>Publié</span>}
            </div>
          </div>
        ))}
        {panels.length === 0 && (
          <p className="col-span-3 text-center text-white/30 text-sm py-10">
            Aucun panel. Créez-en via <code>/role panel</code> dans Discord.
          </p>
        )}
      </div>
    </div>
  );
}
