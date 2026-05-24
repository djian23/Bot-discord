import { TextChannel } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";

export async function generateTranscript(
  client: BotClient,
  ticketId: string,
): Promise<string | null> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      user: true,
      messages: { orderBy: { createdAt: "asc" } },
      claims: { include: { cart: { include: { event: true } } } },
    },
  });

  if (!ticket) return null;

  const lines: string[] = [
    `=== TRANSCRIPT — Ticket #${ticket.id.slice(0, 8)} ===`,
    `User : ${ticket.user.username} (${ticket.user.discordId})`,
    `Ouvert le : ${ticket.createdAt.toLocaleString("fr-FR")}`,
    `Fermé le : ${ticket.closedAt?.toLocaleString("fr-FR") ?? "—"}`,
    "",
    `=== CARTS (${ticket.claims.length}) ===`,
    ...ticket.claims.map((c) =>
      `• [${c.status}] ${c.cart.title} — ${c.cart.event?.name ?? "?"} — ${c.cart.price ? c.cart.price + "€" : "—"} — ${c.createdAt.toLocaleString("fr-FR")}`,
    ),
    "",
    `=== MESSAGES ===`,
    ...ticket.messages.map((m) =>
      `[${m.createdAt.toLocaleString("fr-FR")}]${m.isStaff ? " [STAFF]" : ""} : ${m.content}`,
    ),
  ];

  return lines.join("\n");
}
