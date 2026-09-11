type DatabaseUrlEnvironment = Readonly<
  Record<string, string | undefined>
>;

function firstNonEmpty(
  environment: DatabaseUrlEnvironment,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const value = environment[key]?.trim();

    if (value) {
      return value;
    }
  }

  return undefined;
}

/**
 * Portable PostgreSQL URL. Prefer `DATABASE_URL`; accept the connection-string
 * aliases the Neon Vercel integration injects when that standard name is absent.
 */
export function getDatabaseUrl(
  environment: DatabaseUrlEnvironment = process.env,
): string | undefined {
  return firstNonEmpty(environment, [
    "DATABASE_URL",
    "NEON_DATABASE_URL",
    "NEON_POSTGRES_URL",
    "POSTGRES_URL",
  ]);
}

/**
 * Schema migrations should prefer a direct connection instead of PgBouncer.
 * Fall back to the runtime URL for providers that expose only one connection.
 */
export function getMigrationDatabaseUrl(
  environment: DatabaseUrlEnvironment = process.env,
): string | undefined {
  return (
    firstNonEmpty(environment, [
      "DATABASE_URL_UNPOOLED",
      "NEON_DATABASE_URL_UNPOOLED",
      "NEON_POSTGRES_URL_NON_POOLING",
      "POSTGRES_URL_NON_POOLING",
    ]) ?? getDatabaseUrl(environment)
  );
}
