import { GuildMember } from "discord.js";

type Level = "BOSS" | "ADMIN" | "STAFF" | "VIP";

const ROLE_ENV: Record<Level, string> = {
  BOSS: "DISCORD_BOSS_ROLE_ID",
  ADMIN: "DISCORD_ADMIN_ROLE_ID",
  STAFF: "DISCORD_STAFF_ROLE_ID",
  VIP: "DISCORD_VIP_ROLE_ID",
};

// Returns true if the member has AT LEAST the given level
export function hasPermission(member: any, level: Level): boolean {
  if (!member || typeof member.roles?.cache?.has !== "function") return false;

  const hierarchy: Level[] = ["VIP", "STAFF", "ADMIN", "BOSS"];
  const targetIndex = hierarchy.indexOf(level);

  for (let i = targetIndex; i < hierarchy.length; i++) {
    const roleId = process.env[ROLE_ENV[hierarchy[i]]];
    if (roleId && member.roles.cache.has(roleId)) return true;
  }

  return false;
}
