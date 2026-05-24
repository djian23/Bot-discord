import cron from "node-cron";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";
import { expireCart } from "./cartService";
import { closeTicket } from "./ticketService";
import { cacheGuildInvites } from "./inviteService";

export function startCronJobs(client: BotClient) {
  // Expire carts every minute
  cron.schedule("* * * * *", async () => {
    const expired = await prisma.cart.findMany({
      where: { status: "AVAILABLE", expirationAt: { lte: new Date() } },
    });
    for (const cart of expired) await expireCart(client, cart.id);
  });

  // Auto-close inactive tickets every hour
  cron.schedule("0 * * * *", async () => {
    const guilds = await prisma.guild.findMany();
    for (const guild of guilds) {
      const hoursAgo = new Date(Date.now() - (guild.claimCooldownSeconds || 172800) * 1000);
      const staleTickets = await prisma.ticket.findMany({
        where: { status: "OPEN", lastActivityAt: { lte: hoursAgo } },
      });
      for (const ticket of staleTickets) {
        await closeTicket(client, ticket.id, "system");
      }
    }
  });

  // Cache invites on startup and refresh every 5 minutes
  cacheGuildInvites(client);
  cron.schedule("*/5 * * * *", () => cacheGuildInvites(client));

  console.log("[Cron] Jobs started");
}
