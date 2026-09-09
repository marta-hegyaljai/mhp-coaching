# MHP Hypnose — Architecture

## Philosophy
Use a portable, conventional architecture. We own source code, PostgreSQL schema/data and files. Providers must be replaceable.

## Application
One Next.js App Router application handles:
- public website
- localized SEO pages
- booking UI/server logic
- Stripe checkout/webhooks
- small staff booking view
- email orchestration

No separate API service or microservices for MVP.

## Hosted
```text
Browser / Google
      |
      v
Vercel CDN + Next.js
      |
      +---- Neon PostgreSQL (Frankfurt)
      +---- Stripe
      +---- Email provider
```

Keep Vercel compute near Neon in Central Europe/Frankfurt.
Public marketing/course pages should be static/cached when practical; booking/payment/admin operations are dynamic.

## Local
```text
Browser
  |
Next.js on host (`pnpm dev`)
  |
  +---- PostgreSQL in Docker
  +---- Mailpit in Docker
  +---- FakePaymentProvider by default
```

Expected flow:
```bash
pnpm install
cp .env.example .env.local
docker compose up -d
pnpm db:migrate
pnpm dev
```

Expected URLs:
- app: http://localhost:3000
- PostgreSQL: localhost:5432
- Mailpit UI: http://localhost:8025

## Database
Use standard PostgreSQL + Drizzle ORM with source-controlled migrations.
Hosted provider initially Neon; local provider official PostgreSQL Docker image.
Avoid Neon-specific application APIs where a standard PostgreSQL connection works.
Read `DATABASE_URL` first, then the connection-string aliases the Neon Vercel
integration may inject (`NEON_DATABASE_URL`, `NEON_POSTGRES_URL`, `POSTGRES_URL`).

Initial durable concepts:
- bookings
- optional payment_events
- waitlist_entries for undated published courses

Courses/course dates stay in typed source config initially.
A booking should snapshot commercially important values so historic bookings remain understandable if course config later changes.

## i18n
Use `next-intl`.
Locales: `fr`, `de`, `en`.
URLs: `/fr/...`, `/de/...`, `/en/...`.
Root may redirect to `/fr` for MVP.
Use locale-aware navigation and localized canonical/alternate metadata.
`src/proxy.ts` must bypass a second next-intl pass when the
`x-next-intl-locale` request header is already present. Next 16 can invoke Proxy
again for the localized-path rewrite; without this guard, localized public
paths such as `/fr/formations` loop between public and internal route names.

## Payments
Provider: Stripe.
Methods: TWINT, Visa, Mastercard.

Keep provider code localized behind a small interface such as:
```ts
interface PaymentProvider {
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>;
}
```

Provide `FakePaymentProvider` for deterministic local/E2E tests.

Webhook rules:
- verify Stripe signature
- idempotent processing
- trusted booking/provider references
- transactional status updates where appropriate
- never trust browser-supplied amount/status
- never mark paid from success redirect alone

## Email
Application owns template/content; provider adapter owns delivery.
Local: SMTP to Mailpit.
Hosted: Resend when `RESEND_API_KEY` is set.

## Authentication
No student authentication in MVP.
Keep the tiny staff protection isolated so it can later be replaced by application-owned auth backed by PostgreSQL. Do not introduce Supabase Auth/provider-coupled authorization.

## Suggested structure
```text
src/
  app/                      # routes only: locales, sitemap, robots, API
    [locale]/
    api/stripe/webhook/
    api/staff/bookings.csv/
    api/staff/waitlist.csv/
  features/
    courses/                # catalogue, dates, course UI
    bookings/               # form, validation, persistence
    waitlist/               # undated-course waiting list
    inquiries/              # contact and alternative-payment forms
    payments/{fake,stripe}/ # PaymentProvider adapters + webhook
    email/                  # confirmation + inquiry delivery
    seo/                    # metadata, json-ld, sitemap, legacy 301s
    site-shell/             # header, footer, language switcher
    staff/                  # booking and waitlist lists, CSV, basic auth
    legal/
    organization/
  db/
  i18n/
  lib/
  shared/ui/
messages/{fr,de,en}.json
drizzle/
docs/
tests/
```

## Tests
- unit tests for pure business logic
- integration tests against local PostgreSQL
- Playwright E2E for locale smoke + booking fake-success/failure later
- Stripe-specific tests separately in Stripe test mode

Provide a single `pnpm verify` command that runs at least lint, typecheck, unit tests and production build.

## Deployment
GitHub is source of truth.
Vercel branch/PR previews are part of the development loop.
Production Vercel builds (`VERCEL_ENV=production`, typically `main`) run
`pnpm db:migrate` before `next build` so committed SQL is applied to Neon.
Preview and local builds skip that step.
Do not connect the final production domain until MVP acceptance.

## Portability
Neon replacement: dump/restore PostgreSQL + change `DATABASE_URL`.
Vercel replacement: deploy Next.js elsewhere.
Stripe replacement: implement another payment adapter.
