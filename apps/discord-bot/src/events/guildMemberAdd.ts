import { Events, GuildMember } from "discord.js";
import { BotClient } from "../client";
import { prisma } from "@discord-manager/database";
import { trackInvite } from "../services/inviteService";

export const name = Events.GuildMemberAdd;
export const once = false;

export async function execute(member: GuildMember, client: BotClient) {
  await trackInvite(client, member);
}
