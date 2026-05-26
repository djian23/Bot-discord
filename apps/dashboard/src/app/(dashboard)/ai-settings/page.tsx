import { prisma } from "@discord-manager/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { AiSettingsForm } from "@/components/ai/ai-settings-form";
import { AiLogsTable } from "@/components/ai/ai-logs-table";

export default async function AiSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!["BOSS", "ADMIN"].includes(getSessionUser(session)?.role ?? "")) {
    redirect("/overview");
  }

  const guild = await prisma.guild.findUnique({
    where: { discordId: process.env.DISCORD_GUILD_ID! },
    include: { aiSettings: true },
  });

  const aiSettings = guild?.aiSettings ?? null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">IA Settings</h1>
        <p className="text-sm text-white/50 mt-1">
          Configure l&apos;intégration OpenRouter pour générer du contenu Discord avec l&apos;IA
        </p>
      </div>

      <AiSettingsForm initial={aiSettings} />

      <AiLogsTable />
    </div>
  );
}
