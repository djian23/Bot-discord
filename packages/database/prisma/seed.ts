import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const guildId = process.env.DISCORD_GUILD_ID!;

  await prisma.guild.upsert({
    where: { discordId: guildId },
    update: {},
    create: {
      discordId: guildId,
      name: "My Server",
      defaultClaimsPerDay: 5,
      claimCooldownSeconds: 0,
      settings: {
        create: {
          ticketAutoCloseHours: 48,
          openaiModel: "gpt-4o-mini",
        },
      },
    },
  });

  console.log("✅ Guild created");
  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
