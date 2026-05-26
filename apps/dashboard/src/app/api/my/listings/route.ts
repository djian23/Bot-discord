import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@discord-manager/database";
import botApi from "@/lib/botApi";
import { generateWtsMessage } from "@discord-manager/shared";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { discordId: getSessionUser(session)?.discordId ?? "" },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const listings = await prisma.listing.findMany({
    where: { sellerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { event: { select: { name: true } } },
  });

  return NextResponse.json(listings);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { discordId: getSessionUser(session)?.discordId ?? "" },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { action, title, eventName, date, category, quantity, priceEach, imageUrl, channelId } = body;

  if (action !== "create") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  if (!title || !quantity) {
    return NextResponse.json({ error: "title and quantity are required" }, { status: 400 });
  }

  // Find guild
  const guild = await prisma.guild.findFirst();
  if (!guild) return NextResponse.json({ error: "No guild configured" }, { status: 500 });

  // Find event by name if provided
  let eventId: string | undefined;
  if (eventName) {
    const event = await prisma.event.findFirst({
      where: { guildId: guild.id, name: { contains: eventName, mode: "insensitive" } },
    });
    eventId = event?.id;
  }

  // Generate WTS content
  const content = generateWtsMessage(
    [
      {
        name: eventName ?? title,
        date: date ?? undefined,
        tickets: [
          {
            category: category ?? "CAT",
            quantity: quantity,
            price: priceEach ? `${priceEach}€ each` : undefined,
          },
        ],
      },
    ],
    { style: "HYPE" },
  );

  const listing = await prisma.listing.create({
    data: {
      sellerId: user.id,
      guildId: guild.id,
      eventId: eventId ?? null,
      title,
      date: date ?? null,
      category: category ?? null,
      quantity,
      priceEach: priceEach ?? null,
      image: imageUrl ?? null,
      content,
      discordChannelId: channelId ?? null,
      status: channelId ? "PUBLISHED" : "DRAFT",
    },
  });

  // Post to Discord if channelId provided
  if (channelId) {
    try {
      await botApi.post("/wts/post", {
        channelId,
        content,
        imageUrl: imageUrl ?? undefined,
      });
    } catch {
      // Non-fatal: listing is saved even if Discord post fails
    }
  }

  return NextResponse.json(listing);
}
