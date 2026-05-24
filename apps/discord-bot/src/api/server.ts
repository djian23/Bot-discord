import express from "express";
import { createServer } from "http";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";
import { initWsServer } from "./wsServer";
import { createEventWithChannels } from "../services/eventService";
import { expireCart } from "../services/cartService";
import { closeTicket } from "../services/ticketService";
import { sendAnnouncement } from "../services/announcementService";

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

  const port = parseInt(process.env.BOT_API_PORT ?? "4000");
  httpServer.listen(port, () => console.log(`[API] Server running on port ${port}`));
}
