import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import { BotClient } from "./client";

export interface Command {
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: ChatInputCommandInteraction, client: BotClient) => Promise<void>;
  staffOnly?: boolean;
  adminOnly?: boolean;
  bossOnly?: boolean;
}

export interface ButtonHandler {
  customId: string;
  execute: (interaction: any, client: BotClient) => Promise<void>;
}
