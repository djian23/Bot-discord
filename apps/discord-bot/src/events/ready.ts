import { Events, ActivityType } from "discord.js";
import { BotClient } from "../client";
import { startCronJobs } from "../services/cronService";

export const name = Events.ClientReady;
export const once = true;

export async function execute(client: BotClient) {
  console.log(`[Bot] Logged in as ${client.user?.tag}`);

  client.user?.setPresence({
    activities: [{ name: "cart claims", type: ActivityType.Watching }],
    status: "online",
  });

  startCronJobs(client);
  console.log("[Bot] Ready");
}
