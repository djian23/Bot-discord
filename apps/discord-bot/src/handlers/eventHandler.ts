import { readdirSync } from "fs";
import { join } from "path";
import { BotClient } from "../client";

export function loadEvents(client: BotClient) {
  const eventsPath = join(__dirname, "../events");
  const files = readdirSync(eventsPath).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

  for (const file of files) {
    const event = require(join(eventsPath, file));
    const handler = (...args: unknown[]) => {
      Promise.resolve(event.execute(...args, client)).catch((err: unknown) => {
        console.error(`[Event:${event.name}] Unhandled error:`, err);
      });
    };
    if (event.once) {
      client.once(event.name, handler);
    } else {
      client.on(event.name, handler);
    }
    console.log(`[Events] Loaded: ${event.name}`);
  }
}
