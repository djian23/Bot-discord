import "dotenv/config";
import { BotClient } from "./client";
import { startApiServer } from "./api/server";

async function main() {
  const client = new BotClient();
  await client.init();
  await startApiServer(client);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
