function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT) || 4000,
  databaseUrl: requireEnv('DATABASE_URL'),
  accessTokenSecret:
    process.env.ACCESS_TOKEN_SECRET ??
    (process.env.NODE_ENV === 'test'
      ? 'test-only-access-token-secret-32-bytes-minimum'
      : requireEnv('ACCESS_TOKEN_SECRET')),
  accessTokenTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL_SECONDS) || 900,
  refreshTokenTtlSeconds:
    Number(process.env.REFRESH_TOKEN_TTL_SECONDS) || 604800,
} as const;

if (env.accessTokenSecret.length < 32) {
  throw new Error('ACCESS_TOKEN_SECRET must be at least 32 characters long.');
}
