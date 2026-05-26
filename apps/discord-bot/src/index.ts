import "dotenv/config";
import { validateEnv } from "./utils/validateEnv";
import { BotClient } from "./client";
import { startApiServer } from "./api/server";

validateEnv();

async function main() {
  const client = new BotClient();
  await client.init();
  await startApiServer(client);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
