import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@discord-manager/database";
import botApi from "@/lib/botApi";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const guild = await prisma.guild.findFirst();
  if (!guild) return NextResponse.json([]);
  const msgs = await prisma.wtsMessage.findMany({
    where: { guildId: guild.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(msgs);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, ...data } = body;

  if (action === "post") {
    // Post to Discord channel
    const { channelId, content, mentionRoleId, imageUrl, wtsId } = data;
    try {
      const { data: result } = await botApi.post("/wts/post", { channelId, content, mentionRoleId, imageUrl });
      if (wtsId) {
        await prisma.wtsMessage.update({
          where: { id: wtsId },
          data: { status: "SENT", sentAt: new Date(), discordMsgId: result.messageId },
        });
      }
      return NextResponse.json({ ok: true });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  if (action === "save") {
    const guild = await prisma.guild.findFirst();
    if (!guild) return NextResponse.json({ error: "No guild" }, { status: 404 });
    const msg = await prisma.wtsMessage.create({
      data: {
        guildId: guild.id,
        style: data.style,
        eventsData: data.events,
        content: data.content,
        channelId: data.channelId,
        mentionRoleId: data.mentionRoleId,
        imageUrl: data.imageUrl,
        status: "DRAFT",
      },
    });
    return NextResponse.json(msg);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
