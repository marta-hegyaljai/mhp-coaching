const LOCAL_SITE_URL = "http://localhost:3000";

type SiteUrlEnvironment = Readonly<
  Record<string, string | undefined>
>;

export function parseHttpUrl(value: string | undefined): URL | undefined {
  const candidate = value?.trim();

  if (!candidate) {
    return undefined;
  }

  const absoluteCandidate = /^[a-z][a-z\d+.-]*:/i.test(candidate)
    ? candidate
    : `https://${candidate}`;

  try {
    const url = new URL(absoluteCandidate);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url;
    }
  } catch {
    // Try the next configured source. Metadata must never break a deployment.
  }

  return undefined;
}

export function getSiteUrl(
  environment: SiteUrlEnvironment = process.env,
): URL {
  const candidates = [
    environment.MARKETING_ORIGIN,
    environment.SITE_URL,
    environment.NEXT_PUBLIC_SITE_URL,
    environment.VERCEL_PROJECT_PRODUCTION_URL,
    environment.VERCEL_URL,
    LOCAL_SITE_URL,
  ];

  for (const candidate of candidates) {
    const url = parseHttpUrl(candidate);

    if (url) {
      return url;
    }
  }

  // LOCAL_SITE_URL is a source-controlled valid URL, so this is unreachable.
  throw new Error("No valid site URL is available");
}

export function getMarketingUrl(
  environment: SiteUrlEnvironment = process.env,
): URL {
  return parseHttpUrl(environment.MARKETING_ORIGIN) ?? getSiteUrl(environment);
}

export function getAppUrl(
  environment: SiteUrlEnvironment = process.env,
): URL {
  return parseHttpUrl(environment.APP_ORIGIN) ?? getSiteUrl(environment);
}
