# Security review — CP-11

Engineering review of the modular monolith as shipped through CP-10, with
CP-11 origin and ops hardening. Not a penetration-test report.

## Authentication and sessions

- Passwords hashed; tokens hashed at rest; sessions revocable.
- Cookies: `HttpOnly`, `SameSite=Lax`, `Secure` in production/Vercel, optional
  `SESSION_COOKIE_DOMAIN` for `app` + apex.
- Sign-in rate limited. Email is immutable on the profile.
- CSRF: mutations are server actions bound to the session, not public JSON
  APIs (except signed Stripe webhooks and bearer-auth cron).

## Authorization

- `ADMIN` and `ROOM_BOOKING` are explicit. Negative-role tests cover visitor,
  user, therapist and admin on rooms/billing/admin routes.
- Staff CSV and certificate downloads require a session, not Basic Auth.
- Admins cannot read owner private notes.

## Payments

- `sk_live_` refused unless `VERCEL_ENV=production`.
- Statement amounts come from stored `total_minor`. Charge claims use
  `SELECT … FOR UPDATE` and Stripe idempotency keys.
- Webhooks require a valid signature. Unsigned bodies return 400 and do not
  mark paid. Browser setup return updates the card display only.

## Email and cron

- `sendMail()` throws on Vercel preview. Room notifications record `SKIPPED`.
- Cron requires `CRON_SECRET` (timing-safe compare). Missing secret → 401.
- Ops alerts contain job name and error text, not private notes.

## Secrets and headers

- No production secrets in the repository. `.env.example` is placeholders.
- Private pages send `robots: noindex`. App origin disallows all crawlers
  when `APP_ORIGIN` is configured.

## Residual

- Run `pnpm audit` on a release branch and address high/critical issues.
- Confirm Vercel deployment protection for non-production.
- First live charge should use an internal therapist and a tiny amount.
