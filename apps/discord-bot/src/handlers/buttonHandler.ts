import { readdirSync } from "fs";
import { join } from "path";
import { BotClient } from "../client";

export async function loadButtons(client: BotClient) {
  const buttonsPath = join(__dirname, "../buttons");
  const files = readdirSync(buttonsPath).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

  for (const file of files) {
    const button = await import(join(buttonsPath, file));
    if ("customId" in button && "execute" in button) {
      client.buttons.set(button.customId, button);
      console.log(`[Buttons] Loaded: ${button.customId}`);
    }
  }
}
