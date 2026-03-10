function getEnvValue(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export function getRuntimeDatabaseUrl(): string {
  const databaseUrl =
    getEnvValue("DATABASE_URL") ?? getEnvValue("DATABASE_PUBLIC_URL");

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for app runtime. Set DATABASE_URL or DATABASE_PUBLIC_URL.",
    );
  }

  return databaseUrl;
}

export function getMigrationDatabaseUrl(): string {
  const databaseUrl =
    getEnvValue("DATABASE_PUBLIC_URL") ?? getEnvValue("DATABASE_URL");

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_PUBLIC_URL or DATABASE_URL is required for Drizzle migrations.",
    );
  }

  return databaseUrl;
}

export function getDrizzleKitDatabaseUrl(): string | undefined {
  return getEnvValue("DATABASE_PUBLIC_URL") ?? getEnvValue("DATABASE_URL");
}
