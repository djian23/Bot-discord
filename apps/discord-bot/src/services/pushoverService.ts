import { prisma } from "@discord-manager/database";

interface PushoverOptions {
  priority?: number; // -2 to 2, default 0
  sound?: string;
  url?: string;
  urlTitle?: string;
}

export async function sendPushover(
  userKey: string,
  appToken: string,
  title: string,
  message: string,
  opts: PushoverOptions = {},
) {
  try {
    const res = await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: appToken,
        user: userKey,
        title,
        message,
        priority: opts.priority ?? 0,
        sound: opts.sound ?? "default",
        url: opts.url,
        url_title: opts.urlTitle,
      }),
    });
    if (!res.ok) console.error("[Pushover] Failed:", await res.text());
  } catch (err) {
    console.error("[Pushover] Error:", err);
  }
}

let _appTokenCache: { value: string | null; expiresAt: number } | null = null;

async function getGuildAppToken(): Promise<string | null> {
  const now = Date.now();
  if (_appTokenCache && _appTokenCache.expiresAt > now) return _appTokenCache.value;
  const gs = await prisma.guildSettings.findFirst({ select: { pushoverAppToken: true } });
  const value = gs?.pushoverAppToken ?? null;
  _appTokenCache = { value, expiresAt: now + 5 * 60 * 1000 };
  return value;
}

export async function notifyPublicCart(cartId: string) {
  const appToken = await getGuildAppToken();
  if (!appToken) return;

  const [cart, settings] = await Promise.all([
    prisma.cart.findUnique({ where: { id: cartId }, include: { event: true } }),
    prisma.notificationSettings.findMany({
      where: { enabled: true, notifyPublicCarts: true, pushoverUserKey: { not: null } },
      select: { pushoverUserKey: true, quietHoursStart: true, quietHoursEnd: true },
      take: 500,
    }),
  ]);
  if (!cart) return;

  const message = `Event: ${cart.event.name}\nPrix: ${cart.price != null ? cart.price + "€" : "—"}\nPAS: ${cart.event.pasText ?? (cart.event.pasAmount ? cart.event.pasAmount + "€ each" : "—")}`;
  await Promise.all(
    settings
      .filter((s) => !isQuietHours(s.quietHoursStart, s.quietHoursEnd))
      .map((s) => sendPushover(s.pushoverUserKey!, appToken, "🔥 New Cart Available", message, { priority: 1 })),
  );
}

export async function notifyTicketCart(userId: string, cartId: string) {
  const appToken = await getGuildAppToken();
  if (!appToken) return;

  const s = await prisma.notificationSettings.findUnique({ where: { userId } });
  if (!s?.enabled || !s.notifyTicketCarts || !s.pushoverUserKey) return;
  if (isQuietHours(s.quietHoursStart, s.quietHoursEnd)) return;
  const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: { event: true } });
  if (!cart) return;
  await sendPushover(
    s.pushoverUserKey,
    appToken,
    "📩 New Cart In Your Ticket",
    `Event: ${cart.event.name}\nPrix: ${cart.price != null ? cart.price + "€" : "—"}`,
    { priority: 1 },
  );
}

function isQuietHours(start?: number | null, end?: number | null): boolean {
  if (start == null || end == null) return false;
  const hour = new Date().getHours();
  if (start <= end) return hour >= start && hour < end;
  return hour >= start || hour < end; // overnight range
}
