import { prisma } from "@discord-manager/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/forms/settings-form";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!["BOSS", "ADMIN"].includes(getSessionUser(session)?.role ?? "")) redirect("/overview");

  const guild = await prisma.guild.findUnique({
    where: { discordId: process.env.DISCORD_GUILD_ID! },
    include: { settings: true },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-sm text-white/50 mt-1">Configuration du serveur</p>
      </div>
      <SettingsForm guild={guild} />
    </div>
  );
}
