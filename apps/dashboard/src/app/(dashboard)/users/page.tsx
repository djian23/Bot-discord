import { prisma } from "@discord-manager/database";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { claimsCount: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Users</h1>
      <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-white/40 text-xs uppercase">
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Rôle</th>
              <th className="text-left px-4 py-3">Claims</th>
              <th className="text-left px-4 py-3">Paid</th>
              <th className="text-left px-4 py-3">Invites</th>
              <th className="text-left px-4 py-3">Blacklist</th>
              <th className="text-left px-4 py-3">Depuis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/2">
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{user.username}</div>
                  <div className="text-xs text-white/30 font-mono">{user.discordId}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-discord-blurple/20 text-discord-blurple px-2 py-0.5 rounded-full">{user.role}</span>
                </td>
                <td className="px-4 py-3 text-white/70">{user.claimsCount}</td>
                <td className="px-4 py-3 text-discord-green">{user.paidCount}</td>
                <td className="px-4 py-3 text-white/70">{user.invitesCount}</td>
                <td className="px-4 py-3">
                  {user.isBlacklisted ? (
                    <span className="text-xs bg-discord-red/20 text-discord-red px-2 py-0.5 rounded-full">BL</span>
                  ) : (
                    <span className="text-xs text-white/30">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-white/30 text-xs">
                  {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: fr })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
