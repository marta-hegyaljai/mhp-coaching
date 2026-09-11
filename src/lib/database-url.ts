type DatabaseUrlEnvironment = Readonly<
  Record<string, string | undefined>
>;

function runtimeDatabaseEnvironment(): DatabaseUrlEnvironment {
  // Keep these reads explicit. Next/Vercel's server bundler cannot reliably
  // discover environment variables that are only accessed as process.env[key].
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    NEON_DATABASE_URL: process.env.NEON_DATABASE_URL,
    NEON_POSTGRES_URL: process.env.NEON_POSTGRES_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
    DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
    NEON_DATABASE_URL_UNPOOLED: process.env.NEON_DATABASE_URL_UNPOOLED,
    NEON_POSTGRES_URL_NON_POOLING: process.env.NEON_POSTGRES_URL_NON_POOLING,
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
  };
}

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
 * pg currently treats these legacy SSL modes as verify-full and warns that its
 * next major version will not. Make the current secure behavior explicit for
 * marketplace-provided Neon URLs while leaving local URLs untouched.
 */
function withExplicitSslVerification(url: string | undefined): string | undefined {
  return url?.replace(
    /([?&])sslmode=(?:prefer|require|verify-ca)(?=(&|#|$))/i,
    "$1sslmode=verify-full",
  );
}

/**
 * Portable PostgreSQL URL. Prefer `DATABASE_URL`; accept the connection-string
 * aliases the Neon Vercel integration injects when that standard name is absent.
 */
export function getDatabaseUrl(
  environment: DatabaseUrlEnvironment = runtimeDatabaseEnvironment(),
): string | undefined {
  return withExplicitSslVerification(
    firstNonEmpty(environment, [
      "DATABASE_URL",
      "NEON_DATABASE_URL",
      "NEON_POSTGRES_URL",
      "POSTGRES_URL",
    ]),
  );
}

/**
 * Schema migrations should prefer a direct connection instead of PgBouncer.
 * Fall back to the runtime URL for providers that expose only one connection.
 */
export function getMigrationDatabaseUrl(
  environment: DatabaseUrlEnvironment = runtimeDatabaseEnvironment(),
): string | undefined {
  return withExplicitSslVerification(
    firstNonEmpty(environment, [
      "DATABASE_URL_UNPOOLED",
      "NEON_DATABASE_URL_UNPOOLED",
      "NEON_POSTGRES_URL_NON_POOLING",
      "POSTGRES_URL_NON_POOLING",
    ]) ?? getDatabaseUrl(environment),
  );
}
