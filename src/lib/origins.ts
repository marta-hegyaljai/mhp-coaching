import {locales} from "@/i18n/routing";
import {getAppUrl, getMarketingUrl, parseHttpUrl} from "@/lib/site-url";

export type OriginKind = "app" | "marketing";

export type SplitOrigins = {
  marketing: URL;
  app: URL;
};

const APP_FIRST_SEGMENTS = new Set([
  "admin",
  "staff",
  "account",
  "compte",
  "konto",
  "sign-in",
  "connexion",
  "anmelden",
  "sign-up",
  "creer-un-compte",
  "konto-erstellen",
  "forgot-password",
  "mot-de-passe-oublie",
  "passwort-vergessen",
  "reset-password",
  "reinitialiser-mot-de-passe",
  "passwort-zuruecksetzen",
  "verify-email",
  "confirmer-email",
  "e-mail-bestaetigen",
  "invite",
  "invitation",
  "einladung",
  "rooms",
  "salles",
  "raeume",
  "billing",
  "facturation",
  "abrechnung",
  "access-denied",
  "acces-refuse",
  "zugriff-verweigert",
]);

type OriginEnvironment = Readonly<Record<string, string | undefined>>;

function hostnameOf(hostHeader: string): string {
  return hostHeader.trim().split(":")[0]?.toLowerCase() ?? "";
}

export function getSplitOrigins(
  environment: OriginEnvironment = process.env,
): SplitOrigins | null {
  const app = parseHttpUrl(environment.APP_ORIGIN);
  if (!app) {
    return null;
  }
  const marketing =
    parseHttpUrl(environment.MARKETING_ORIGIN) ??
    parseHttpUrl(environment.SITE_URL) ??
    getMarketingUrl(environment);
  if (app.host.toLowerCase() === marketing.host.toLowerCase()) {
    return null;
  }
  return {app, marketing};
}

export function isAppHost(hostHeader: string, app: URL): boolean {
  return hostnameOf(hostHeader) === app.hostname.toLowerCase();
}

export function isMarketingHost(hostHeader: string, marketing: URL): boolean {
  const host = hostnameOf(hostHeader);
  const expected = marketing.hostname.toLowerCase();
  if (host === expected) {
    return true;
  }
  if (expected.startsWith("www.")) {
    return host === expected.slice(4);
  }
  return host === `www.${expected}`;
}

export function classifyPath(pathname: string): OriginKind {
  const parts = pathname.split("/").filter(Boolean);
  const rest =
    parts[0] && (locales as readonly string[]).includes(parts[0])
      ? parts.slice(1)
      : parts;
  const first = rest[0] ?? "";
  if (!first) {
    return "marketing";
  }
  return APP_FIRST_SEGMENTS.has(first) ? "app" : "marketing";
}

export function requestHost(headers: Headers): string {
  return headers.get("x-forwarded-host") ?? headers.get("host") ?? "";
}

export function classifyRequestHost(
  hostHeader: string,
  split: SplitOrigins,
): OriginKind | "unknown" {
  if (isAppHost(hostHeader, split.app)) {
    return "app";
  }
  if (isMarketingHost(hostHeader, split.marketing)) {
    return "marketing";
  }
  return "unknown";
}

export function dualOriginRedirect(
  request: Request,
  environment: OriginEnvironment = process.env,
): URL | null {
  const split = getSplitOrigins(environment);
  if (!split) {
    return null;
  }
  const host = requestHost(request.headers);
  if (!host) {
    return null;
  }
  const current = classifyRequestHost(host, split);
  if (current === "unknown") {
    return null;
  }
  const url = new URL(request.url);
  const needed = classifyPath(url.pathname);
  if (needed === current) {
    return null;
  }
  const target = needed === "app" ? split.app : split.marketing;
  return new URL(`${url.pathname}${url.search}`, target);
}

export {getAppUrl, getMarketingUrl};
