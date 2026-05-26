const REQUIRED = [
  "DISCORD_TOKEN",
  "DISCORD_CLIENT_ID",
  "DISCORD_GUILD_ID",
  "DATABASE_URL",
  "BOT_API_SECRET",
] as const;

export function validateEnv(): void {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error("[Startup] Missing required environment variables:");
    missing.forEach((key) => console.error(`  - ${key}`));
    process.exit(1);
  }
}
