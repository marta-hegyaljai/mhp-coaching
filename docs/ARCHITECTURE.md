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
- shared account, profile, permission and email infrastructure
- authenticated course history and certificates (My Courses registrations and certificate library)
- therapist room availability (inventory, hours, blocks and privacy-safe calendar); booking, current-month usage, saved payment method and monthly statements
- role-aware administration (admin users, access, rooms, hours and staff lists)

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
is `app.mhp-coaching.ch`. Both are served by this application. Set `APP_ORIGIN`
and `MARKETING_ORIGIN` for 308 host redirects; unset, local and preview stay
single-origin. See [`LAUNCH.md`](./LAUNCH.md).

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
Hosted schema migrations prefer the matching direct connection
(`DATABASE_URL_UNPOOLED`, `NEON_DATABASE_URL_UNPOOLED`,
`NEON_POSTGRES_URL_NON_POOLING` or `POSTGRES_URL_NON_POOLING`) and fall back to
the runtime URL when a provider exposes only one connection string.

Initial durable concepts:
- course bookings (the current table is named `bookings`)
- optional payment_events
- waitlist_entries for published courses (undated, full sessions, or dated when no session fits), with optional session id and staff notified flag
- course and session availability status (`auto` by default, or an explicit
  available / full / dates-pending / registration-closed override that drives
  the public CTA while occupancy still blocks overselling)
- course_call_hours, course_calls and course_inquiries for the free
  fifteen-minute advice call and written questions. `course_id` and
  `course_title` stay nullable: the standalone `/advice` page books the same
  slots with no course attached, and the admin screens label those rows as a
  general enquiry
- inquiry_replies for staff answers to a course question, contact-form
  message or other-payment-method lead, sent through `sendMail()` (Resend
  when hosted, Mailpit locally)

Courses/course dates are seeded into PostgreSQL from the typed TypeScript
catalogue (`src/features/courses/catalog.ts`) so go-live data is durable. Public
catalogue reads still use that typed seed until a later course-admin slice.
A booking should snapshot commercially important values so historic bookings remain understandable if course config later changes.

Planned shared concepts:

- users, normalized verified email identities and profiles;
- password credentials/recovery tokens and revocable sessions;
- roles/capabilities (`ADMIN`, `ROOM_BOOKING`);
- one shared Stripe customer reference per user; and
- audit and notification-delivery records.

Planned room concepts stay room-prefixed: rooms, opening hours, room blocks,
room bookings, booking history, separately protected private notes, availability
requests, user discounts, current-month usage projections, statement/adjustment
line items, monthly statements and payment attempts.

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

interface BillingPaymentAdapter {
  createSetupSession(input: CreateBillingSetupInput): Promise<BillingSetupSession>;
}
```

Provide `FakePaymentProvider` and `FakeBillingPaymentAdapter` for deterministic local/E2E tests. Course checkout and room payment-method setup share `PAYMENT_PROVIDER`. Room billing stores one Stripe customer id per user and only card display metadata (brand, last4, expiry).

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
Hosted: Resend when `RESEND_API_KEY` is set, or when the Vercel Resend
marketplace resource injects a prefixed alias (`EMAILS_RESEND_RESEND_API_KEY`
and `EMAILS_RESEND_RESEND_EMAIL_DOMAIN`). Prefer the connected marketplace API
key, while keeping the portable names as provider-independent fallbacks. Do not
add a second mail provider.

Binding layout and copy: `docs/EMAIL.md`. HTML is composed only through
`composeTransactionalEmail()` in `src/features/email/layout.ts` (tables and
inline styles). Shared detail labels live in `Email.fields`.

Transactional mail sent through `src/features/email`:
- buyer confirmation after a booking becomes `PAID`, retried until recorded
- staff (`contact@mhp-coaching.ch`) on paid or failed purchases
- staff on contact-form and alternative-payment inquiries
- staff when a booking is saved as `LEAD` (other payment method)
- staff when someone joins a waiting list
- invited user when an admin sends or resends an account invitation
- public sign-up email verification (`sendEmailVerification`)
- password reset (`sendPasswordRecovery`)

## Authentication

Current state: PostgreSQL accounts with public self-registration, email
verification, password recovery, in-session password change, a basic profile,
My Courses, scrypt password hashes, revocable cookie sessions, an `ADMIN` role
and a `ROOM_BOOKING` capability. Staff booking/waitlist pages and CSV exports
require an enabled admin session. HTTP Basic Auth has been removed. Guest
course checkout remains available without an account.

Do not introduce Supabase Auth or another provider-coupled authorization system.

Every self-registered or invited account receives course-user access. `ROOM_BOOKING` is an explicit
admin-granted capability; `ADMIN` is an administrative role. Navigation reflects
capabilities, but every query and mutation also enforces them server-side. An
admin can manage room operations but cannot read private booking notes. Private
notes live separately and require owner identity, not a role override.

Rate-limit sign-in, sign-up, password recovery and invitation acceptance, keep session cookies HttpOnly /
SameSite=Lax / Secure in production, hash session and auth tokens at rest,
verify emails before sign-in and before historical booking reconciliation, and never trust browser-supplied
user IDs or roles. Normalized email (`email_normalized`) is the unique account
identifier: PostgreSQL rejects a second row for the same address, including
case variants. Account email is permanent for now: users cannot change it on
the profile page. A successfully consumed password-recovery link also verifies
the recipient's email and can initialize a password for a pre-provisioned
passwordless account. The first admin is created with `pnpm db:bootstrap-admin`
from environment variables; the command refuses to run when an enabled admin
already exists.

## Suggested structure
```text
src/
  app/                      # routes only: locales, sitemap, robots, API
    [locale]/
    api/stripe/webhook/
    api/staff/bookings.csv/
    api/staff/waitlist.csv/
    api/certificates/[id]/document/
  features/
    auth/                   # credentials, sessions, invitations, recovery, profile
    account/                # My Courses and verified-email booking reconciliation
    users/                  # planned: Stripe identity
    courses/                # catalogue, dates, course UI
    bookings/               # existing course form, validation, persistence
    certificates/           # personal certificate library on My Courses
    rooms/                  # inventory, hours, blocks, privacy-safe availability,
                            # reservations, owner-only notes, requests, discounts, usage,
                            # payment method and monthly statements
    room-bookings/          # booking lifecycle lives in features/rooms
    room-requests/          # request inbox lives in features/rooms
    room-billing/           # usage, statements and payment-method live in features/rooms
    waitlist/               # waiting list for published courses
    inquiries/              # contact and alternative-payment forms
    payments/{fake,stripe}/ # PaymentProvider adapters + webhook
    email/                  # composeTransactionalEmail + senders (see docs/EMAIL.md)
    seo/                    # metadata, json-ld, sitemap, legacy 301s
    site-shell/             # header, footer, language switcher
    staff/                  # admin-protected course lists/CSV
    admin/                  # user invitation, disable/enable, capabilities
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
Production and preview Vercel builds (`VERCEL_ENV=production` or `preview`) run
`pnpm db:migrate` before `next build` so committed SQL is applied to Neon.
Production builds also re-seed the course catalogue. Local `pnpm build` skips
those steps.
`drizzle-kit migrate` applies every pending file in one transaction. PostgreSQL
cannot use `ALTER TYPE ... ADD VALUE` until that transaction commits, so a new
enum value that a later pending file must insert has to be introduced by
recreating the type in the same migrate run.
New production application domains must not be connected until their release
acceptance and rollback plan are complete. Follow [`LAUNCH.md`](./LAUNCH.md)
and [`OPERATIONS.md`](./OPERATIONS.md).

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
