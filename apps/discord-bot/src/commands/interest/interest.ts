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
  .setName("interest")
  .setDescription("Gestion des interest checks")
  .addSubcommand((sub) =>
    sub
      .setName("create")
      .setDescription("Créer un interest check")
      .addStringOption((o) => o.setName("title").setDescription("Titre").setRequired(true))
      .addChannelOption((o) => o.setName("channel").setDescription("Salon").setRequired(true))
      .addStringOption((o) => o.setName("description").setDescription("Description").setRequired(false))
      .addStringOption((o) =>
        o.setName("buttons").setDescription('Boutons séparés par virgule (ex: "Interested,Need ASAP,Not interested")')
          .setRequired(false),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("results")
      .setDescription("Voir les résultats d\'un interest check")
      .addStringOption((o) => o.setName("id").setDescription("ID").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("close")
      .setDescription("Fermer un interest check")
      .addStringOption((o) => o.setName("id").setDescription("ID").setRequired(true)),
  );

export const staffOnly = true;

const DEFAULT_BUTTONS = ["Interested", "Need ASAP", "Not Interested"];
const BUTTON_STYLES: ButtonStyle[] = [ButtonStyle.Success, ButtonStyle.Primary, ButtonStyle.Danger];

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const sub = interaction.options.getSubcommand();

  if (sub === "create") {
    await interaction.deferReply({ ephemeral: true });

    const title = interaction.options.getString("title", true);
    const channel = interaction.options.getChannel("channel", true);
    const description = interaction.options.getString("description") ?? undefined;
    const buttonsRaw = interaction.options.getString("buttons") ?? DEFAULT_BUTTONS.join(",");
    const buttonLabels = buttonsRaw.split(",").map((b) => b.trim()).filter(Boolean).slice(0, 4);

    const guild = await prisma.guild.findUnique({ where: { discordId: interaction.guildId! } });
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });

    const check = await prisma.interestCheck.create({
      data: {
        guildId: guild!.id,
        channelId: channel.id,
        title,
        description,
        isActive: true,
        createdById: user!.id,
        buttons: {
          create: buttonLabels.map((label, i) => ({
            label,
            customId: `btn_${i}`,
            style: ["SUCCESS", "PRIMARY", "DANGER", "SECONDARY"][i] ?? "PRIMARY",
            position: i,
          })),
        },
      },
      include: { buttons: { orderBy: { position: "asc" } } },
    });

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${title}`)
      .setDescription(description ?? "Vote avec les boutons ci-dessous !")
      .setColor(0x5865f2)
      .setFooter({ text: `Interest Check ID: ${check.id.slice(0, 8)}` })
      .setTimestamp();

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    const rowBuilder = new ActionRowBuilder<ButtonBuilder>();

    for (let i = 0; i < check.buttons.length; i++) {
      const btn = check.buttons[i];
      rowBuilder.addComponents(
        new ButtonBuilder()
          .setCustomId(`interest_vote:${check.id}:${btn.id}`)
          .setLabel(btn.label)
          .setStyle(BUTTON_STYLES[i] ?? ButtonStyle.Primary),
      );
    }
    rows.push(rowBuilder);

    const msg = await (client.channels.cache.get(channel.id) as TextChannel)?.send({
      embeds: [embed],
      components: rows,
    });

    if (msg) {
      await prisma.interestCheck.update({ where: { id: check.id }, data: { messageId: msg.id } });
    }

    await interaction.editReply(`✅ Interest check créé dans <#${channel.id}> ! ID : \`${check.id}\``);
    return;
  }

  if (sub === "results") {
    await interaction.deferReply({ ephemeral: true });
    const id = interaction.options.getString("id", true);

    const check = await prisma.interestCheck.findUnique({
      where: { id },
      include: {
        buttons: { include: { _count: { select: { votes: true } } } },
        _count: { select: { votes: true } },
      },
    });
    if (!check) return interaction.editReply("❌ Interest check introuvable.");

    const total = check._count.votes;
    const lines = check.buttons.map((b) => {
      const pct = total > 0 ? Math.round((b._count.votes / total) * 100) : 0;
      const bar = "█".repeat(Math.floor(pct / 10)) + "░".repeat(10 - Math.floor(pct / 10));
      return `**${b.label}** : ${b._count.votes} votes (${pct}%)\n\`${bar}\``;
    });

    await interaction.editReply(`📊 **${check.title}** — ${total} votes au total\n\n${lines.join("\n\n")}`);
    return;
  }

  if (sub === "close") {
    await interaction.deferReply({ ephemeral: true });
    const id = interaction.options.getString("id", true);
    await prisma.interestCheck.update({ where: { id }, data: { isActive: false } });
    await interaction.editReply("✅ Interest check fermé.");
  }
}
