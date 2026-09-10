# MHP Hypnose — Architecture

## Philosophy
Use a portable, conventional architecture. We own source code, PostgreSQL schema/data and files. Providers must be replaceable.

The existing course MVP evolves into one modular-monolith **MHP Platform**. Do
not create a second application, deployment, database, account or Stripe customer
model for room booking. Shared infrastructure may be reused, but Courses and
Rooms own separate domain logic and tables. See
[`ROOM-BOOKING.md`](./ROOM-BOOKING.md) for binding room behavior.
Delivery order and implementation status are maintained in
[`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md); architecture sections do
not imply that a planned component already exists.

## Application
One Next.js App Router application handles:
- public website
- localized SEO pages
- course booking UI/server logic and Stripe checkout/webhooks
- shared account, profile, permission and email infrastructure (planned)
- authenticated course history/certificates (planned)
- therapist room availability, booking and monthly billing (planned)
- role-aware administration (planned; Basic Auth is the current MVP bridge)

No separate API service or microservices.

Conceptual dependencies point inward through explicit interfaces:

```text
app/routes
├── shared: auth, users, permissions, profile, email, Stripe identity, UI
├── courses: catalogue, sessions, registrations, course payments
└── rooms: inventory, availability, bookings, requests, billing
```

Courses and Rooms may reference a shared user ID. They must not reach into each
other's repositories or reuse ambiguous entities such as a generic `bookings`
model for new work. Prefer `course_*` and `room_*` names. Existing `bookings`
remains the course-MVP table until a safe forward migration renames it.

## Hosted
```text
Browser / Google
      |
      v
Vercel CDN + Next.js
      |
      +---- Neon PostgreSQL (Frankfurt)
      +---- Stripe
      +---- Resend
      +---- Vercel Web Analytics
```

Keep Vercel compute near Neon in Central Europe/Frankfurt.
Public marketing/course pages should be static/cached when practical;
authentication, booking, payment, account and admin operations are dynamic. The
public marketing origin remains `mhp-coaching.ch`; the authenticated application
is intended for `app.mhp-coaching.ch`. Both are served by this application unless
a later deployment decision says otherwise.

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
- course bookings (the current table is named `bookings`)
- optional payment_events
- waitlist_entries for published courses (undated, or dated when no session fits)

Courses/course dates stay in typed source config initially.
A booking should snapshot commercially important values so historic bookings remain understandable if course config later changes.

Planned shared concepts:

- users, normalized verified email identities and profiles;
- password credentials/recovery tokens and revocable sessions;
- roles/capabilities (`ADMIN`, `ROOM_BOOKING`);
- one shared Stripe customer reference per user; and
- audit and notification-delivery records.

Planned room concepts stay room-prefixed: rooms, opening hours, room blocks,
room bookings, booking history, separately protected private notes, availability
requests, user discounts, statement/adjustment line items, monthly statements
and payment attempts.

Guest course registrations remain valid without a `userId`. Once an account has
verified its email, an idempotent reconciliation links matching registrations by
normalized case-insensitive email. The immutable submitted email stays on the
course booking as a historical snapshot. Never expose matches before verification.

The first certificate-library slice stores authorized PDF documents in portable
PostgreSQL `bytea`, capped at 10 MiB, behind a certificate repository/download
boundary. Documents are never public assets. That boundary permits a later move
to owned object storage without changing certificate identity or authorization.

All monetary values use integer minor units and a currency. Room bookings also
snapshot duration, base rate, discount, effective rate and final amount. Monthly
statements become immutable when finalized; later corrections are append-only
adjustments.

Room intervals use timezone-aware instants. Opening-hour rules use
`Europe/Zurich` wall time and require DST-boundary tests. Enforce non-overlapping
active room bookings at the PostgreSQL level where possible, backed by the same
transactional checks for room blocks and rescheduling.

## i18n
Use `next-intl`.
Locales: `fr`, `de`, `en`.
URLs: `/fr/...`, `/de/...`, `/en/...`.
Root may redirect to `/fr` for MVP.
Use locale-aware navigation and localized canonical/alternate metadata.
Authenticated routes follow the same prefix, for example `/{locale}/rooms`,
`/{locale}/rooms/calendar`, `/{locale}/rooms/bookings`,
`/{locale}/rooms/requests`, `/{locale}/billing` and `/{locale}/profile`.
They are private/noindex and must not enter the public sitemap.
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
Hosted: Resend when `RESEND_API_KEY` is set. Do not add a second mail provider.

Binding layout and copy: `docs/EMAIL.md`. HTML is composed only through
`composeTransactionalEmail()` in `src/features/email/layout.ts` (tables and
inline styles). Shared detail labels live in `Email.fields`.

Transactional mail sent through `src/features/email`:
- buyer confirmation after a booking becomes `PAID`
- staff (`contact@mhp-coaching.ch`) on paid or failed purchases
- staff on contact-form and alternative-payment inquiries
- staff when a booking is saved as `LEAD` (other payment method)
- staff when someone joins a waiting list

## Authentication

Current state: no user authentication; a tiny isolated HTTP Basic Auth guard
protects staff booking/waitlist routes.

Target state: application-owned, PostgreSQL-backed accounts with verified email,
secure password hashing, revocable cookie sessions and recovery/invitation flows.
Do not introduce Supabase Auth or another provider-coupled authorization system.

Every account receives course-user access. `ROOM_BOOKING` is an explicit
admin-granted capability; `ADMIN` is an administrative role. Navigation reflects
capabilities, but every query and mutation also enforces them server-side. An
admin can manage room operations but cannot read private booking notes. Private
notes live separately and require owner identity, not a role override.

The account/auth implementation must receive a dedicated threat-model and
security review. Rate-limit auth/recovery, protect mutations from CSRF as needed,
use secure cookie attributes, verify emails before reconciliation, and never
trust browser-supplied user IDs or roles.

## Suggested structure
```text
src/
  app/                      # routes only: locales, sitemap, robots, API
    [locale]/
    api/stripe/webhook/
    api/staff/bookings.csv/
    api/staff/waitlist.csv/
  features/
    auth/                   # planned: credentials, sessions, invitations, recovery
    users/                  # planned: profile, capability and Stripe identity
    courses/                # catalogue, dates, course UI
    bookings/               # existing course form, validation, persistence
    course-account/         # planned: own registrations/history/certificates
    rooms/                  # planned: inventory, hours, blocks, availability
    room-bookings/          # planned: booking lifecycle + private-note boundary
    room-requests/          # planned: no-availability requests
    room-billing/           # planned: usage, statements, adjustments, payments
    waitlist/               # waiting list for published courses
    inquiries/              # contact and alternative-payment forms
    payments/{fake,stripe}/ # PaymentProvider adapters + webhook
    email/                  # composeTransactionalEmail + senders (see docs/EMAIL.md)
    seo/                    # metadata, json-ld, sitemap, legacy 301s
    site-shell/             # header, footer, language switcher
    staff/                  # current course lists/CSV/basic auth; migrate to admin
    admin/                  # planned: role-aware platform administration
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
- Playwright E2E for locale, SEO and fake-booking flows
- Stripe-specific tests separately in Stripe test mode

Before room launch, add tests for capability/ownership authorization, guest
registration reconciliation after verified email, private-note non-disclosure,
concurrent overlapping requests, blocks/opening hours, late-cancellation billing,
statement immutability, webhook replay and Zurich DST edges. Admin serializers and
exports must be tested to prove they never select or return private notes.

Provide a single `pnpm verify` command that runs at least lint, typecheck, unit tests and production build.

## Deployment
GitHub is source of truth.
Vercel branch/PR previews are part of the development loop.
Production Vercel builds (`VERCEL_ENV=production`, typically `main`) run
`pnpm db:migrate` before `next build` so committed SQL is applied to Neon.
Preview and local builds skip that step.
New production application domains must not be connected until their release
acceptance and rollback plan are complete.

The course MVP has passed this stage. For platform expansion, preserve public
course availability during forward-only migrations. Scheduling for reminders and
month-end statement finalization must be idempotent, observable and safe to retry;
do not rely on one browser request or an in-memory timer.

## Portability
Neon replacement: dump/restore PostgreSQL + change `DATABASE_URL`.
Vercel replacement: deploy Next.js elsewhere. Web Analytics is the
`@vercel/analytics` script in the locale layout; drop or replace that
component if the host changes.
Stripe replacement: implement another payment adapter.
Resend replacement: retain application-owned templates and notification history,
then replace only the delivery adapter.
Authentication replacement: session/account data remains in PostgreSQL and is
not coupled to a database vendor.
