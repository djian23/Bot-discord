import { readdirSync } from "fs";
import { join } from "path";
import { BotClient } from "../client";

export function loadEvents(client: BotClient) {
  const eventsPath = join(__dirname, "../events");
  const files = readdirSync(eventsPath).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

  for (const file of files) {
    const event = require(join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    console.log(`[Events] Loaded: ${event.name}`);
  }
}
