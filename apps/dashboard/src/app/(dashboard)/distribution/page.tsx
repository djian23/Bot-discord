import { prisma } from "@discord-manager/database";
import { DistributionModeForm } from "@/components/dashboard/distribution-mode-form";

export default async function DistributionPage() {
  const events = await prisma.event.findMany({
    include: { distributionSettings: true },
    orderBy: { createdAt: "desc" },
  });

  const MODE_COLORS: Record<string, string> = {
    PUBLIC_CLAIM: "bg-discord-blurple/20 text-discord-blurple",
    DIRECT_TICKET: "bg-discord-green/20 text-discord-green",
    PUBLIC_ONLY: "bg-white/10 text-white/60",
    STAFF_REVIEW: "bg-discord-yellow/20 text-discord-yellow",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Distribution</h1>
        <p className="text-sm text-white/50 mt-1">Configure le mode de distribution par événement</p>
      </div>

      <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-white/40 text-xs uppercase">
              <th className="text-left px-4 py-3">Événement</th>
              <th className="text-left px-4 py-3">Mode actuel</th>
              <th className="text-left px-4 py-3">Configuration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {events.map((event) => {
              const mode = event.distributionSettings?.mode ?? event.distributionMode ?? "PUBLIC_CLAIM";
              return (
                <tr key={event.id} className="hover:bg-white/2">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{event.name}</p>
                    <p className="text-xs text-white/30 font-mono">{event.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${MODE_COLORS[mode] ?? "bg-white/10 text-white/40"}`}
                    >
                      {mode}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DistributionModeForm event={event} settings={event.distributionSettings} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {events.length === 0 && (
          <p className="text-center text-white/30 text-sm py-10">Aucun événement.</p>
        )}
      </div>
    </div>
  );
}
