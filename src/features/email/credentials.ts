import {organization} from "@/features/organization/info";

type CredentialEnvironment = Readonly<Record<string, string | undefined>>;

const VERCEL_MARKETPLACE_API_KEY_KEYS = [
  "EMAILS_RESEND_RESEND_API_KEY",
] as const;
const PORTABLE_API_KEY_KEYS = ["RESEND_API_KEY"] as const;
const PORTABLE_FROM_KEYS = ["RESEND_FROM", "SMTP_FROM"] as const;
const PORTABLE_DOMAIN_KEYS = ["RESEND_EMAIL_DOMAIN"] as const;

const LOCAL_FROM = `${organization.brandName} <no-reply@mhp.local>`;
const CONTACT_LOCAL_PART = organization.email.split("@")[0] ?? "contact";

function firstNonEmpty(
  environment: CredentialEnvironment,
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

function firstMatchingSuffix(
  environment: CredentialEnvironment,
  suffix: string,
): string | undefined {
  const keys = Object.keys(environment)
    .filter((key) => key === suffix || key.endsWith(`_${suffix}`))
    .sort();

  return firstNonEmpty(environment, keys);
}

/**
 * Prefer the connected Vercel marketplace resource, then the portable
 * `RESEND_API_KEY`. Accept other prefixed marketplace aliases as a final
 * fallback for installations that use a different resource prefix.
 */
export function getResendApiKey(
  environment: CredentialEnvironment = process.env,
): string | undefined {
  return (
    firstNonEmpty(environment, VERCEL_MARKETPLACE_API_KEY_KEYS) ??
    firstNonEmpty(environment, PORTABLE_API_KEY_KEYS) ??
    firstMatchingSuffix(environment, "RESEND_API_KEY")
  );
}

function fromAddressFromDomain(domain: string): string {
  const normalized = domain
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .toLowerCase();

  if (normalized.includes("@")) {
    return normalized.includes("<")
      ? normalized
      : `${organization.brandName} <${normalized}>`;
  }

  return `${organization.brandName} <${CONTACT_LOCAL_PART}@${normalized}>`;
}

/**
 * Prefer `RESEND_FROM`, then SMTP, then a mailbox built from the verified
 * domain the Vercel Resend integration stores (`RESEND_EMAIL_DOMAIN` or a
 * prefixed `*_RESEND_EMAIL_DOMAIN`).
 */
export function getResendFromAddress(
  environment: CredentialEnvironment = process.env,
): string {
  const configured = firstNonEmpty(environment, PORTABLE_FROM_KEYS);

  if (configured) {
    return configured;
  }

  const domain =
    firstNonEmpty(environment, PORTABLE_DOMAIN_KEYS) ??
    firstMatchingSuffix(environment, "RESEND_EMAIL_DOMAIN");

  if (domain) {
    return fromAddressFromDomain(domain);
  }

  return LOCAL_FROM;
}
