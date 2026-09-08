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

Initial durable concepts:
- bookings
- optional payment_events

Courses/course dates stay in typed source config initially.
A booking should snapshot commercially important values so historic bookings remain understandable if course config later changes.

## i18n
Use `next-intl`.
Locales: `fr`, `de`, `en`.
URLs: `/fr/...`, `/de/...`, `/en/...`.
Root may redirect to `/fr` for MVP.
Use locale-aware navigation and localized canonical/alternate metadata.

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
Hosted: Resend/Postmark later.

## Authentication
No student authentication in MVP.
Keep the tiny staff protection isolated so it can later be replaced by application-owned auth backed by PostgreSQL. Do not introduce Supabase Auth/provider-coupled authorization.

## Suggested structure
```text
src/
  app/
    [locale]/
    api/stripe/webhook/
  components/
  config/courses/
  db/
  i18n/
  lib/
    bookings/
    payments/{fake,stripe}/
    email/
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
Do not connect the final production domain until MVP acceptance.

## Portability
Neon replacement: dump/restore PostgreSQL + change `DATABASE_URL`.
Vercel replacement: deploy Next.js elsewhere.
Stripe replacement: implement another payment adapter.
