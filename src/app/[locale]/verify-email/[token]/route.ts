import {redirect} from "next/navigation";

import {verifySignupEmail} from "@/features/auth/register";
import {createSessionCookie} from "@/features/auth/session";
import {signedInHomeHref} from "@/features/auth/signed-in-home";
import {localizedPathname} from "@/i18n/path";
import {locales, type AppLocale} from "@/i18n/routing";

export const dynamic = "force-dynamic";

function resolveLocale(locale: string): AppLocale {
  return (locales as readonly string[]).includes(locale)
    ? (locale as AppLocale)
    : "fr";
}

/**
 * Confirmation links must sign the person in on GET. Setting the session
 * cookie from a Server Component is not allowed, so this route handler
 * verifies, writes the cookie, and redirects.
 */
export async function GET(
  _request: Request,
  context: {params: Promise<{locale: string; token: string}>},
) {
  const {locale: rawLocale, token} = await context.params;
  const locale = resolveLocale(rawLocale);
  const result = token
    ? await verifySignupEmail(token)
    : {ok: false as const, reason: "invalid" as const};

  if (result.ok) {
    await createSessionCookie(result.user.id);
    redirect(localizedPathname(locale, signedInHomeHref(result.user, {verified: true})));
  }

  redirect(
    localizedPathname(locale, {
      pathname: "/sign-in",
      query: {verify: "invalid"},
    }),
  );
}
