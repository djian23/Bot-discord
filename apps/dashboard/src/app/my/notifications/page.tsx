import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@discord-manager/database";
import { NotificationSettingsForm } from "@/components/user/notification-settings-form";

export default async function MyNotificationsPage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { discordId: (session?.user as any)?.discordId ?? "" },
  });
  if (!user) redirect("/my");

  const notifSettings = await prisma.notificationSettings.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-sm text-white/50 mt-1">Configure tes notifications Pushover</p>
      </div>
      <NotificationSettingsForm userId={user.id} initial={notifSettings} />
    </div>
  );
}
