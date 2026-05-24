import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../../client";
import { repostCart } from "../../services/cartService";
import { expireCart } from "../../services/cartService";

export const data = new SlashCommandBuilder()
  .setName("cart")
  .setDescription("Gestion des carts")
  .addSubcommand((sub) =>
    sub
      .setName("list")
      .setDescription("Lister les carts disponibles")
      .addStringOption((o) =>
        o.setName("status").setDescription("Filtrer par statut").setRequired(false)
          .addChoices(
            { name: "Available", value: "AVAILABLE" },
            { name: "Claimed", value: "CLAIMED" },
            { name: "Paid", value: "PAID" },
            { name: "Expired", value: "EXPIRED" },
          ),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("repost")
      .setDescription("Reposter un cart dans son salon public")
      .addStringOption((o) => o.setName("id").setDescription("ID du cart").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("expire")
      .setDescription("Expirer un cart manuellement")
      .addStringOption((o) => o.setName("id").setDescription("ID du cart").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("info")
      .setDescription("Voir les infos d'un cart")
      .addStringOption((o) => o.setName("id").setDescription("ID du cart (8 premiers chars)").setRequired(true)),
  );

export const staffOnly = true;

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const sub = interaction.options.getSubcommand();

  if (sub === "list") {
    await interaction.deferReply({ ephemeral: true });
    const status = interaction.options.getString("status") as any ?? undefined;

    const carts = await prisma.cart.findMany({
      where: status ? { status } : { status: "AVAILABLE" },
      include: { event: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    if (!carts.length) return interaction.editReply("Aucun cart trouvé.");

    const lines = carts.map((c) =>
      `• \`${c.id.slice(0, 8)}\` **${c.title}** — ${c.event?.name ?? "?"} — ${c.status} — ${c.price ? c.price + "€" : "—"}`,
    );
    await interaction.editReply(`**Carts (${status ?? "AVAILABLE"}) :**\n${lines.join("\n")}`);
    return;
  }

  if (sub === "repost") {
    await interaction.deferReply({ ephemeral: true });
    const id = interaction.options.getString("id", true);

    const cart = await prisma.cart.findFirst({
      where: { id: { startsWith: id } },
      include: { event: true },
    });
    if (!cart) return interaction.editReply("❌ Cart introuvable.");

    await repostCart(client, cart as any);
    await interaction.editReply(`✅ Cart \`${cart.id.slice(0, 8)}\` reposté !`);
    return;
  }

  if (sub === "expire") {
    await interaction.deferReply({ ephemeral: true });
    const id = interaction.options.getString("id", true);
    const cart = await prisma.cart.findFirst({ where: { id: { startsWith: id } } });
    if (!cart) return interaction.editReply("❌ Cart introuvable.");

    await expireCart(client, cart.id);
    await interaction.editReply(`✅ Cart \`${cart.id.slice(0, 8)}\` expiré.`);
    return;
  }

  if (sub === "info") {
    await interaction.deferReply({ ephemeral: true });
    const id = interaction.options.getString("id", true);

    const cart = await prisma.cart.findFirst({
      where: { id: { startsWith: id } },
      include: { event: { select: { name: true } }, claims: { include: { user: true } } },
    });
    if (!cart) return interaction.editReply("❌ Cart introuvable.");

    const claimed = cart.claims[0];
    const lines = [
      `**Cart \`${cart.id.slice(0, 8)}\`**`,
      `Titre : ${cart.title}`,
      `Event : ${cart.event?.name ?? "—"}`,
      `Site : ${cart.site ?? "—"}`,
      `Prix : ${cart.price ? cart.price + "€" : "—"} | Qty : ${cart.quantity}`,
      `Section : ${cart.section ?? "—"} | Rang : ${cart.row ?? "—"}`,
      `Statut : **${cart.status}**`,
      `Expiration : ${cart.expirationAt?.toLocaleString("fr-FR") ?? "aucune"}`,
      `Claimed par : ${claimed ? claimed.user.username : "—"}`,
      `Checkout : ||${cart.checkoutLink ?? "non défini"}||`,
    ];
    await interaction.editReply(lines.join("\n"));
  }
}
