import { prisma } from "@discord-manager/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ServerBuilder } from "@/components/dashboard/server-builder";

const SECTION_TOTALS: Record<string, number> = {
  IMPORTANT: 10,
  CARTS: 9,
  EVENTS: 7,
  TOOLS: 10,
  GENERAL: 7,
  MARKETPLACE: 7,
  STAFF: 8,
};

async function getServerStatus() {
  const guild = await prisma.guild.findFirst();
  if (!guild) return { channels: [], sectionStats: {} };

  const dbChannels = await prisma.serverChannel.findMany({
    where: { guildId: guild.id },
    orderBy: [{ section: "asc" }, { name: "asc" }],
  });

  const channelsBySection: Record<string, number> = {};
  for (const ch of dbChannels) {
    const sec = ch.section ?? "UNKNOWN";
    channelsBySection[sec] = (channelsBySection[sec] ?? 0) + 1;
  }

  const sectionStats: Record<string, { total: number; created: number; status: "complete" | "partial" | "missing" }> = {};

  for (const [section, total] of Object.entries(SECTION_TOTALS)) {
    const created = channelsBySection[section] ?? 0;
    sectionStats[section] = {
      total,
      created,
      status: created === 0 ? "missing" : created === total ? "complete" : "partial",
    };
  }

  return {
    channels: dbChannels.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      section: c.section,
      channelRole: c.channelRole,
      discordId: c.discordId,
      isEnabled: c.isEnabled,
      isPrivate: c.isPrivate,
    })),
    sectionStats,
  };
}

export default async function ServerSetupPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { channels, sectionStats } = await getServerStatus();

  const totalChannels = Object.values(SECTION_TOTALS).reduce((s, v) => s + v, 0);
  const createdChannels = Object.values(sectionStats).reduce((s, v) => s + v.created, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Server Structure Builder</h1>
        <p className="text-sm text-white/50 mt-1">
          {createdChannels}/{totalChannels} canaux configurés
        </p>
      </div>

      <ServerBuilder sectionStats={sectionStats} channels={channels} />
    </div>
  );
}
