import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../../client";

export const data = new SlashCommandBuilder()
  .setName("giveaway")
  .setDescription("Gestion des giveaways")
  .addSubcommand((sub) =>
    sub
      .setName("create")
      .setDescription("Créer un giveaway")
      .addStringOption((o) => o.setName("title").setDescription("Titre").setRequired(true))
      .addChannelOption((o) => o.setName("channel").setDescription("Salon").setRequired(true))
      .addIntegerOption((o) => o.setName("duration").setDescription("Durée en minutes").setRequired(true))
      .addIntegerOption((o) => o.setName("winners").setDescription("Nombre de gagnants").setRequired(false))
      .addStringOption((o) => o.setName("description").setDescription("Description").setRequired(false)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("end")
      .setDescription("Terminer un giveaway")
      .addStringOption((o) => o.setName("id").setDescription("ID du giveaway").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("reroll")
      .setDescription("Reroll un giveaway")
      .addStringOption((o) => o.setName("id").setDescription("ID du giveaway").setRequired(true)),
  );

export const staffOnly = true;

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const sub = interaction.options.getSubcommand();

  if (sub === "create") {
    await interaction.deferReply({ ephemeral: true });

    const title = interaction.options.getString("title", true);
    const channel = interaction.options.getChannel("channel", true);
    const duration = interaction.options.getInteger("duration", true);
    const winnersCount = interaction.options.getInteger("winners") ?? 1;
    const description = interaction.options.getString("description") ?? undefined;

    const endsAt = new Date(Date.now() + duration * 60 * 1000);
    const guild = await prisma.guild.findUnique({ where: { discordId: interaction.guildId! } });
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });

    const giveaway = await prisma.giveaway.create({
      data: {
        guildId: guild!.id,
        channelId: channel.id,
        title,
        description,
        winnersCount,
        endsAt,
        createdById: user!.id,
        status: "ACTIVE",
      },
    });

    const embed = new EmbedBuilder()
      .setTitle(`🎁 GIVEAWAY — ${title}`)
      .setDescription(description ?? "Clique sur le bouton pour participer !")
      .setColor(0x5865f2)
      .addFields(
        { name: "Gagnants", value: String(winnersCount), inline: true },
        { name: "Fin", value: `<t:${Math.floor(endsAt.getTime() / 1000)}:R>`, inline: true },
      )
      .setTimestamp(endsAt)
      .setFooter({ text: `Giveaway ID: ${giveaway.id.slice(0, 8)}` });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_enter:${giveaway.id}`)
        .setLabel("🎉 Participer")
        .setStyle(ButtonStyle.Primary),
    );

    const msg = await (client.channels.cache.get(channel.id) as TextChannel)?.send({
      embeds: [embed],
      components: [row],
    });

    if (msg) {
      await prisma.giveaway.update({ where: { id: giveaway.id }, data: { messageId: msg.id } });
    }

    await interaction.editReply(`✅ Giveaway créé dans <#${channel.id}> ! ID : \`${giveaway.id}\``);
    return;
  }

  if (sub === "end") {
    await interaction.deferReply({ ephemeral: true });
    const id = interaction.options.getString("id", true);
    await drawGiveaway(client, id);
    await interaction.editReply("✅ Giveaway terminé !");
    return;
  }

  if (sub === "reroll") {
    await interaction.deferReply({ ephemeral: true });
    const id = interaction.options.getString("id", true);
    await drawGiveaway(client, id, true);
    await interaction.editReply("✅ Reroll effectué !");
  }
}

async function drawGiveaway(client: BotClient, giveawayId: string, reroll = false) {
  const giveaway = await prisma.giveaway.findUnique({
    where: { id: giveawayId },
    include: { entries: true },
  });
  if (!giveaway) return;

  const entries = giveaway.entries;
  if (!entries.length) return;

  const shuffled = entries.sort(() => Math.random() - 0.5);
  const winners = shuffled.slice(0, giveaway.winnersCount);

  for (const winner of winners) {
    await prisma.giveawayWinner.create({ data: { giveawayId, userId: winner.userId } });
  }

  if (!reroll) {
    await prisma.giveaway.update({ where: { id: giveawayId }, data: { status: "ENDED", endedAt: new Date() } });
  }

  const channel = client.channels.cache.get(giveaway.channelId) as TextChannel;
  const winnerMentions = winners.map((w) => `<@${w.userId}>`).join(", ");

  await channel?.send(
    `🎉 **Félicitations aux gagnants du giveaway "${giveaway.title}" !**\n${winnerMentions}`,
  );
}
