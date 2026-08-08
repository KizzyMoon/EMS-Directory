export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '',
  discordClientId: import.meta.env.VITE_DISCORD_CLIENT_ID ?? '',
  discordRedirectUrl: import.meta.env.VITE_DISCORD_REDIRECT_URL ?? '',
  discordGuildId: import.meta.env.VITE_DISCORD_GUILD_ID ?? '',
};

export const isBackendConfigured = Boolean(env.apiBaseUrl);
