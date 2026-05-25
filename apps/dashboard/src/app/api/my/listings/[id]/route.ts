import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@discord-manager/database";
import botApi from "@/lib/botApi";
import { generateWtsMessage } from "@discord-manager/shared";

async function getAuthedUser(session: Awaited<ReturnType<typeof getServerSession>>) {
  if (!session) return null;
  return prisma.user.findUnique({
    where: { discordId: (session.user as any)?.discordId ?? "" },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getAuthedUser(session);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.sellerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { action } = body;

  if (action === "edit") {
    const { title, date, category, quantity, priceEach, imageUrl, channelId } = body;
    await prisma.listing.update({
      where: { id: params.id },
      data: {
        title: title ?? listing.title,
        date: date ?? listing.date,
        category: category ?? listing.category,
        quantity: quantity ?? listing.quantity,
        priceEach: priceEach ?? listing.priceEach,
        image: imageUrl ?? listing.image,
        discordChannelId: channelId ?? listing.discordChannelId,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "republish") {
    const content = generateWtsMessage(
      [
        {
          name: listing.title,
          date: listing.date ?? undefined,
          tickets: [
            {
              category: listing.category ?? "CAT",
              quantity: listing.quantity,
              price: listing.priceEach ? `${listing.priceEach}€ each` : undefined,
            },
          ],
        },
      ],
      { style: "HYPE" },
    );

    await prisma.listing.update({
      where: { id: params.id },
      data: { status: "PUBLISHED", content },
    });

    if (listing.discordChannelId) {
      try {
        await botApi.post("/wts/post", {
          channelId: listing.discordChannelId,
          content,
          imageUrl: listing.image ?? undefined,
        });
      } catch {
        // Non-fatal
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "sold") {
    await prisma.listing.update({ where: { id: params.id }, data: { status: "SOLD" } });
    return NextResponse.json({ ok: true });
  }

  if (action === "archive") {
    await prisma.listing.update({ where: { id: params.id }, data: { status: "ARCHIVED" } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getAuthedUser(session);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.sellerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.listing.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
