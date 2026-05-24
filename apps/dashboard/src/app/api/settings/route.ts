import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@discord-manager/database";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!["BOSS", "ADMIN"].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const guild = await prisma.guild.upsert({
    where: { discordId: process.env.DISCORD_GUILD_ID! },
    update: {
      bossRoleId: body.bossRoleId || null,
      adminRoleId: body.adminRoleId || null,
      staffRoleId: body.staffRoleId || null,
      vipRoleId: body.vipRoleId || null,
      successLogsChannelId: body.successLogsChannelId || null,
      errorLogsChannelId: body.errorLogsChannelId || null,
      staffLogsChannelId: body.staffLogsChannelId || null,
      defaultClaimsPerDay: parseInt(body.defaultClaimsPerDay) || 5,
      claimCooldownSeconds: parseInt(body.claimCooldownSeconds) || 0,
      blockNewAccounts: Boolean(body.blockNewAccounts),
      minAccountAgeDays: parseInt(body.minAccountAgeDays) || 0,
    },
    create: {
      discordId: process.env.DISCORD_GUILD_ID!,
      name: "My Server",
      bossRoleId: body.bossRoleId || null,
      adminRoleId: body.adminRoleId || null,
      staffRoleId: body.staffRoleId || null,
      vipRoleId: body.vipRoleId || null,
      successLogsChannelId: body.successLogsChannelId || null,
      errorLogsChannelId: body.errorLogsChannelId || null,
      staffLogsChannelId: body.staffLogsChannelId || null,
      defaultClaimsPerDay: parseInt(body.defaultClaimsPerDay) || 5,
      claimCooldownSeconds: parseInt(body.claimCooldownSeconds) || 0,
      blockNewAccounts: Boolean(body.blockNewAccounts),
      minAccountAgeDays: parseInt(body.minAccountAgeDays) || 0,
    },
  });

  await prisma.guildSettings.upsert({
    where: { guildId: guild.id },
    update: {
      ticketAutoCloseHours: parseInt(body.ticketAutoCloseHours) || 48,
      openaiModel: body.openaiModel || "gpt-4o-mini",
    },
    create: {
      guildId: guild.id,
      ticketAutoCloseHours: parseInt(body.ticketAutoCloseHours) || 48,
      openaiModel: body.openaiModel || "gpt-4o-mini",
    },
  });

  return NextResponse.json({ ok: true });
}
