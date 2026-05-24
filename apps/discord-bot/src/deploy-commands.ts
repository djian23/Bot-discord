import "dotenv/config";
import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";

const commands: any[] = [];
const commandsPath = join(__dirname, "commands");

for (const folder of readdirSync(commandsPath)) {
  const files = readdirSync(join(commandsPath, folder)).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));
  for (const file of files) {
    const cmd = require(join(commandsPath, folder, file));
    if (cmd.data) commands.push(cmd.data.toJSON());
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

(async () => {
  console.log(`Deploying ${commands.length} commands...`);
  await rest.put(
    Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, process.env.DISCORD_GUILD_ID!),
    { body: commands },
  );
  console.log("Done.");
})();
