import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "@discord-manager/database";

const ALLOWED_ROLES = ["BOSS", "ADMIN", "STAFF"];

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify email guilds" } },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.id) return false;

      const dbUser = await prisma.user.upsert({
        where: { discordId: user.id },
        update: { username: user.name ?? "", avatar: user.image },
        create: {
          discordId: user.id,
          username: user.name ?? "",
          avatar: user.image,
        },
      });

      // Only allow staff+ to access dashboard
      if (!ALLOWED_ROLES.includes(dbUser.role)) return "/unauthorized";

      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        const dbUser = await prisma.user.findUnique({ where: { discordId: token.sub } });
        if (dbUser) {
          (session.user as any).id = dbUser.id;
          (session.user as any).discordId = dbUser.discordId;
          (session.user as any).role = dbUser.role;
        }
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account) token.accessToken = account.access_token;
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/unauthorized",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
