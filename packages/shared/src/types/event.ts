export interface CreateEventPayload {
  guildId: string;
  name: string;
  site?: string;
  image?: string;
  pasAmount?: number;
  pasText?: string;
  embedColor?: string;
  mode: "PUBLIC" | "VIP" | "PRIVATE";
  allowedRoleId?: string;
  defaultExpiresIn?: number;
}

export interface EventChannelConfig {
  publicChannelId: string;
  sourceChannelId: string;
  logsChannelId: string;
  privateChannelId?: string;
  webhookId: string;
  webhookUrl: string;
}
