import { Events, GuildMember, PartialGuildMember } from "discord.js";
import { BotClient } from "../client";
import { prisma } from "@discord-manager/database";

export const name = Events.GuildMemberRemove;
export const once = false;

export async function execute(member: GuildMember | PartialGuildMember, _client: BotClient) {
  await prisma.invite.updateMany({
    where: { inviteeId: member.id, status: "VALID" },
    data: { status: "LEFT", leftAt: new Date() },
  });

  await prisma.user.updateMany({
    where: { discordId: member.id },
    data: { invitesCount: { decrement: 1 } },
  });
}
