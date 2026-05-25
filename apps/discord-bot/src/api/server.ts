import express from "express";
import { createServer } from "http";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";
import { initWsServer } from "./wsServer";
import { createEventWithChannels } from "../services/eventService";
import { expireCart } from "../services/cartService";
import { closeTicket } from "../services/ticketService";
import { sendAnnouncement } from "../services/announcementService";
import {
  buildServerStructure,
  scanServer,
  repairServer,
  getServerStatus,
} from "../services/serverBuilderService";

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const secret = req.headers["x-bot-secret"];
  if (secret !== process.env.BOT_API_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export async function startApiServer(client: BotClient) {
  const app = express();
  app.use(express.json());
  app.use(authMiddleware);

  const httpServer = createServer(app);
  initWsServer(httpServer);

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", bot: client.isReady(), uptime: process.uptime() });
  });

  // Event creation
  app.post("/events", async (req, res) => {
    try {
      const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID!);
      if (!guild) return res.status(503).json({ error: "Guild not available" });
      const result = await createEventWithChannels(guild, req.body);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Cart expire
  app.post("/carts/:id/expire", async (req, res) => {
    await expireCart(client, req.params.id);
    res.json({ ok: true });
  });

  // Ticket close
  app.post("/tickets/:id/close", async (req, res) => {
    await closeTicket(client, req.params.id, req.body.closedById ?? "dashboard");
    res.json({ ok: true });
  });

  // Send announcement
  app.post("/announcements/:id/send", async (req, res) => {
    await sendAnnouncement(client, req.params.id);
    res.json({ ok: true });
  });

  // Create giveaway from dashboard
  app.post("/giveaways", async (req, res) => {
    try {
      const { title, channelId, description, durationMinutes, winnersCount, requiredRoleId, minClaims, pingEveryone } = req.body;
      const guild = await prisma.guild.findUnique({ where: { discordId: process.env.DISCORD_GUILD_ID! } });
      if (!guild) return res.status(404).json({ error: "Guild not found" });

      const endsAt = new Date(Date.now() + (durationMinutes ?? 60) * 60 * 1000);

      const giveaway = await prisma.giveaway.create({
        data: {
          guildId: guild.id,
          channelId,
          title,
          description: description ?? undefined,
          winnersCount: winnersCount ?? 1,
          requiredRoleId: requiredRoleId ?? undefined,
          minClaims: minClaims ?? 0,
          pingEveryone: Boolean(pingEveryone),
          endsAt,
          createdById: guild.id,
          status: "ACTIVE",
        },
      });

      const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = await import("discord.js");
      const channel = client.channels.cache.get(channelId) as any;
      if (channel) {
        const embed = new EmbedBuilder()
          .setTitle(`🎁 GIVEAWAY — ${title}`)
          .setDescription(description ?? "Clique sur le bouton pour participer !")
          .setColor(0x5865f2)
          .addFields(
            { name: "Gagnants", value: String(winnersCount ?? 1), inline: true },
            { name: "Fin", value: `<t:${Math.floor(endsAt.getTime() / 1000)}:R>`, inline: true },
          )
          .setTimestamp(endsAt);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`giveaway_enter:${giveaway.id}`)
            .setLabel("🎉 Participer")
            .setStyle(ButtonStyle.Primary),
        );

        const msg = await channel.send({ embeds: [embed], components: [row] });
        await prisma.giveaway.update({ where: { id: giveaway.id }, data: { messageId: msg.id } });
      }

      res.json({ ok: true, id: giveaway.id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Giveaway end
  app.post("/giveaways/:id/end", async (req, res) => {
    try {
      const giveaway = await prisma.giveaway.findUnique({
        where: { id: req.params.id },
        include: { entries: true },
      });
      if (!giveaway) return res.status(404).json({ error: "Not found" });

      const shuffled = giveaway.entries.sort(() => Math.random() - 0.5);
      const winners = shuffled.slice(0, giveaway.winnersCount);
      for (const w of winners) {
        await prisma.giveawayWinner.create({ data: { giveawayId: giveaway.id, userId: w.userId } }).catch(() => {});
      }
      await prisma.giveaway.update({ where: { id: giveaway.id }, data: { status: "ENDED", endedAt: new Date() } });

      const channel = client.channels.cache.get(giveaway.channelId) as any;
      if (channel && winners.length) {
        const mentions = winners.map((w) => `<@${w.userId}>`).join(", ");
        await channel.send(`🏆 **Giveaway terminé !** Félicitations : ${mentions}`);
      }

      res.json({ ok: true, winners: winners.length });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Giveaway reroll
  app.post("/giveaways/:id/reroll", async (req, res) => {
    try {
      const giveaway = await prisma.giveaway.findUnique({
        where: { id: req.params.id },
        include: { entries: true },
      });
      if (!giveaway) return res.status(404).json({ error: "Not found" });

      const shuffled = giveaway.entries.sort(() => Math.random() - 0.5);
      const winners = shuffled.slice(0, giveaway.winnersCount);
      for (const w of winners) {
        await prisma.giveawayWinner.create({ data: { giveawayId: giveaway.id, userId: w.userId } }).catch(() => {});
      }

      const channel = client.channels.cache.get(giveaway.channelId) as any;
      if (channel && winners.length) {
        const mentions = winners.map((w) => `<@${w.userId}>`).join(", ");
        await channel.send(`🔁 **Reroll !** Nouveaux gagnants : ${mentions}`);
      }

      res.json({ ok: true, winners: winners.length });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Repost cart
  app.post("/carts/:id/repost", async (req, res) => {
    try {
      const cart = await prisma.cart.findUnique({ where: { id: req.params.id }, include: { event: true } });
      if (!cart) return res.status(404).json({ error: "Not found" });
      const { repostCart } = await import("../services/cartService");
      await repostCart(client, cart as any);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Stats snapshot
  app.get("/stats", async (_req, res) => {
    const guild = await prisma.guild.findUnique({ where: { discordId: process.env.DISCORD_GUILD_ID! } });
    if (!guild) return res.status(404).json({ error: "Not found" });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [cartsToday, claimsToday, paidToday, openTickets] = await Promise.all([
      prisma.cart.count({ where: { event: { guildId: guild.id }, createdAt: { gte: todayStart } } }),
      prisma.claim.count({ where: { cart: { event: { guildId: guild.id } }, createdAt: { gte: todayStart } } }),
      prisma.claim.count({ where: { cart: { event: { guildId: guild.id } }, status: "PAID", createdAt: { gte: todayStart } } }),
      prisma.ticket.count({ where: { status: "OPEN" } }),
    ]);

    res.json({ cartsToday, claimsToday, paidToday, openTickets });
  });

  // Server status
  app.get("/server/status", async (_req, res) => {
    try {
      const guild = await prisma.guild.findUnique({ where: { discordId: process.env.DISCORD_GUILD_ID! } });
      if (!guild) return res.status(404).json({ error: "Guild not found" });
      const status = await getServerStatus(guild.id);
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Build server structure
  app.post("/server/build", async (req, res) => {
    try {
      const { sections, skipExisting = true } = req.body;
      const result = await buildServerStructure(client, process.env.DISCORD_GUILD_ID!, sections, skipExisting);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Scan server
  app.post("/server/scan", async (_req, res) => {
    try {
      const result = await scanServer(client, process.env.DISCORD_GUILD_ID!);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Repair server
  app.post("/server/repair", async (req, res) => {
    try {
      const { sections } = req.body;
      const result = await repairServer(client, process.env.DISCORD_GUILD_ID!, sections);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get/upsert distribution settings for an event
  app.post("/events/:id/distribution", async (req, res) => {
    try {
      const { mode, targetUserId, targetRoleId, ticketCategoryId, notifyPushover, staffReviewChannelId } = req.body;
      const event = await prisma.event.findUnique({ where: { id: req.params.id } });
      if (!event) return res.status(404).json({ error: "Event not found" });

      const settings = await prisma.eventDistributionSettings.upsert({
        where: { eventId: req.params.id },
        create: { eventId: req.params.id, mode, targetUserId, targetRoleId, ticketCategoryId, notifyPushover: Boolean(notifyPushover), staffReviewChannelId },
        update: { mode, targetUserId, targetRoleId, ticketCategoryId, notifyPushover: Boolean(notifyPushover), staffReviewChannelId },
      });
      res.json(settings);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // WTS post
  app.post("/wts/post", async (req, res) => {
    try {
      const { channelId, content, mentionRoleId, imageUrl } = req.body;
      const channel = client.channels.cache.get(channelId) as any;
      if (!channel) return res.status(404).json({ error: "Channel not found" });
      const prefix = mentionRoleId ? `<@&${mentionRoleId}>\n` : "";
      const files = imageUrl ? [{ attachment: imageUrl }] : [];
      const msg = await channel.send({ content: prefix + content, files });
      res.json({ ok: true, messageId: msg.id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  const port = parseInt(process.env.BOT_API_PORT ?? "4000");
  httpServer.listen(port, () => console.log(`[API] Server running on port ${port}`));
}
