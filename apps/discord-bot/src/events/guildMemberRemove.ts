import { Events, GuildMember, PartialGuildMember } from "discord.js";
import { BotClient } from "../client";
import { prisma } from "@discord-manager/database";

export const name = Events.GuildMemberRemove;
export const once = false;

export async function execute(member: GuildMember | PartialGuildMember, _client: BotClient) {
  // Find the user record by Discord ID
  const user = await prisma.user.findUnique({ where: { discordId: member.id } });
  if (!user) return;

  // Mark the invite as LEFT and decrement the inviter's count
  const invite = await prisma.invite.findUnique({
    where: { inviteeId: user.id },
    select: { id: true, inviterId: true, status: true },
  });

  if (invite && invite.status === "VALID") {
    await prisma.invite.update({
      where: { id: invite.id },
      data: { status: "LEFT", leftAt: new Date() },
    });

    // Decrement the inviter's invite count
    await prisma.user.update({
      where: { id: invite.inviterId },
      data: { invitesCount: { decrement: 1 } },
    });
  }
}
