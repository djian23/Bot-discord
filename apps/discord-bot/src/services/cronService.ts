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
    const guilds = await prisma.guild.findMany({ include: { settings: true } });
    for (const guild of guilds) {
      const autoCloseHours = guild.settings?.ticketAutoCloseHours ?? 48;
      const cutoff = new Date(Date.now() - autoCloseHours * 60 * 60 * 1000);
      const staleTickets = await prisma.ticket.findMany({
        where: { status: "OPEN", lastActivityAt: { lte: cutoff } },
      });
      for (const ticket of staleTickets) {
        await closeTicket(client, ticket.id, "system");
      }
    }
  });

  // Cache invites on startup and refresh every 5 minutes
  cacheGuildInvites(client);
  cron.schedule("*/5 * * * *", () => cacheGuildInvites(client));

  // Daily stats snapshot at midnight
  cron.schedule("0 0 * * *", async () => {
    const guilds = await prisma.guild.findMany();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    for (const guild of guilds) {
      const [cartsReceived, cartsClaimed, cartsPaid, cartsExpired, cartsCancelled, ticketsOpened, ticketsClosed, newUsers] =
        await Promise.all([
          prisma.cart.count({ where: { event: { guildId: guild.id }, createdAt: { gte: yesterday, lt: todayStart } } }),
          prisma.cart.count({ where: { event: { guildId: guild.id }, status: "CLAIMED", updatedAt: { gte: yesterday, lt: todayStart } } }),
          prisma.cart.count({ where: { event: { guildId: guild.id }, status: "PAID", updatedAt: { gte: yesterday, lt: todayStart } } }),
          prisma.cart.count({ where: { event: { guildId: guild.id }, status: "EXPIRED", updatedAt: { gte: yesterday, lt: todayStart } } }),
          prisma.cart.count({ where: { event: { guildId: guild.id }, status: "CANCELLED", updatedAt: { gte: yesterday, lt: todayStart } } }),
          prisma.ticket.count({ where: { createdAt: { gte: yesterday, lt: todayStart } } }),
          prisma.ticket.count({ where: { closedAt: { gte: yesterday, lt: todayStart } } }),
          prisma.user.count({ where: { createdAt: { gte: yesterday, lt: todayStart } } }),
        ]);

      await prisma.dailyStats.upsert({
        where: { guildId_date: { guildId: guild.id, date: yesterday } },
        update: { cartsReceived, cartsClaimed, cartsPaid, cartsExpired, cartsCancelled, ticketsOpened, ticketsClosed, newUsers },
        create: { guildId: guild.id, date: yesterday, cartsReceived, cartsClaimed, cartsPaid, cartsExpired, cartsCancelled, ticketsOpened, ticketsClosed, newUsers },
      });
    }
    console.log("[Cron] Daily stats snapshot done");
  });

  // Expire giveaways
  cron.schedule("* * * * *", async () => {
    const ended = await prisma.giveaway.findMany({
      where: { status: "ACTIVE", endsAt: { lte: new Date() } },
    });
    for (const g of ended) {
      const entries = await prisma.giveawayEntry.findMany({ where: { giveawayId: g.id } });
      const shuffled = entries.sort(() => Math.random() - 0.5);
      const winners = shuffled.slice(0, g.winnersCount);

      for (const w of winners) {
        await prisma.giveawayWinner.create({ data: { giveawayId: g.id, userId: w.userId } }).catch(() => {});
      }

      await prisma.giveaway.update({ where: { id: g.id }, data: { status: "ENDED", endedAt: new Date() } });

      const channel = client.channels.cache.get(g.channelId) as any;
      if (channel && winners.length) {
        const mentions = winners.map((w) => `<@${w.userId}>`).join(", ");
        await channel.send(`🏆 **Giveaway terminé !** Félicitations : ${mentions}`);
      }
    }
  });

  console.log("[Cron] Jobs started");
}
