import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@discord-manager/database";

export interface SessionUser {
  discordId: string;
  role: string;
  name?: string | null;
  image?: string | null;
}

export function getSessionUser(session: Awaited<ReturnType<typeof getServerSession>>): SessionUser | null {
  const u = session?.user as any;
  if (!u?.discordId) return null;
  return {
    discordId: u.discordId,
    role: u.role ?? "USER",
    name: u.name ?? null,
    image: u.image ?? null,
  };
}

export async function getAuthedDbUser(session: Awaited<ReturnType<typeof getServerSession>>) {
  const su = getSessionUser(session);
  if (!su) return null;
  return prisma.user.findUnique({ where: { discordId: su.discordId } });
}

export async function requireRole(
  session: Awaited<ReturnType<typeof getServerSession>>,
  roles: string[],
): Promise<SessionUser | null> {
  const su = getSessionUser(session);
  if (!su || !roles.includes(su.role)) return null;
  return su;
}
