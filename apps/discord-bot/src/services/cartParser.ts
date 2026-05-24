import { Message } from "discord.js";
import type { ParsedCart } from "@discord-manager/shared";

export function parseCartFromEmbed(message: Message): ParsedCart | null {
  if (!message.embeds.length) return null;

  const embed = message.embeds[0];
  const cart: ParsedCart = { title: embed.title ?? "Cart" };

  // Parse fields by common label patterns
  for (const field of embed.fields) {
    const key = field.name.toLowerCase().replace(/[^a-z]/g, "");
    const val = field.value.replace(/[`*_~]/g, "").trim();

    if (key.includes("site")) cart.site = val;
    else if (key.includes("prix") || key.includes("price")) {
      cart.price = parseFloat(val.replace(/[^0-9.,]/g, "").replace(",", "."));
    } else if (key.includes("qty") || key.includes("quantity") || key.includes("quantit")) {
      cart.quantity = parseInt(val);
    } else if (key.includes("section")) cart.section = val;
    else if (key.includes("row") || key.includes("rang")) cart.row = val;
    else if (key.includes("categ")) cart.category = val;
    else if (key.includes("checkout") || key.includes("link")) cart.checkoutLink = val;
    else if (key.includes("expir")) {
      cart.expirationAt = parseExpiration(val);
    } else if (key.includes("id") || key.includes("ref")) cart.cartExternalId = val;
  }

  // Description fallback
  if (!cart.checkoutLink && embed.description) {
    const match = embed.description.match(/https?:\/\/\S+/);
    if (match) cart.checkoutLink = match[0];
  }

  if (embed.image?.url) cart.image = embed.image.url;
  else if (embed.thumbnail?.url) cart.image = embed.thumbnail.url;

  return cart;
}

function parseExpiration(val: string): Date | undefined {
  const minMatch = val.match(/(\d+)\s*min/i);
  if (minMatch) {
    return new Date(Date.now() + parseInt(minMatch[1]) * 60 * 1000);
  }
  const hrMatch = val.match(/(\d+)\s*h/i);
  if (hrMatch) {
    return new Date(Date.now() + parseInt(hrMatch[1]) * 60 * 60 * 1000);
  }
  const parsed = new Date(val);
  if (!isNaN(parsed.getTime())) return parsed;
  return undefined;
}
