import {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import { loadCommands } from "./handlers/commandHandler";
import { loadEvents } from "./handlers/eventHandler";
import { loadButtons } from "./handlers/buttonHandler";
import type { Command } from "./types";

export class BotClient extends Client {
  commands: Collection<string, Command> = new Collection();
  buttons: Collection<string, any> = new Collection();

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildPresences,
      ],
      partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
    });
  }

  async init() {
    await loadCommands(this);
    await loadButtons(this);
    loadEvents(this);
    await this.login(process.env.DISCORD_TOKEN);
  }
}
