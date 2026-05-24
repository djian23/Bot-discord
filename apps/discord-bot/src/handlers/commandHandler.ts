import { readdirSync } from "fs";
import { join } from "path";
import { BotClient } from "../client";

export async function loadCommands(client: BotClient) {
  const commandsPath = join(__dirname, "../commands");
  const folders = readdirSync(commandsPath);

  for (const folder of folders) {
    const folderPath = join(commandsPath, folder);
    const files = readdirSync(folderPath).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

    for (const file of files) {
      const command = await import(join(folderPath, file));
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
        console.log(`[Commands] Loaded: ${command.data.name}`);
      }
    }
  }
}
