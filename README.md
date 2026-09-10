# MHP Platform

Multilingual Next.js platform for MHP Coaching. The implemented baseline is the
public course catalogue, guest registration, Stripe (TWINT/card) or fake payment,
waitlist/contact flows and a small protected staff list.

The next approved expansion adds shared user accounts and a private room-booking
module for selected therapists. It is planned, not implemented. The same modular
monolith will support visitors, normal course users, therapists with explicit
room access and admins. See
[`docs/ROOM-BOOKING.md`](./docs/ROOM-BOOKING.md).

Execution progress is tracked in
[`docs/IMPLEMENTATION-PLAN.md`](./docs/IMPLEMENTATION-PLAN.md). Future work can be
requested unambiguously as “implement CP-01” or “implement through CP-05”; agents
must update that ledger with status and verification evidence after each completed
checkpoint.

## Prerequisites

- Node.js 20.9 or newer (an active LTS release is recommended)
- pnpm 11 (the repository pins the expected version through `packageManager`)
- Docker Desktop or another Docker Engine with Compose v2

## Fresh-clone setup

```bash
pnpm install
cp .env.example .env.local
docker compose up -d
pnpm db:migrate
pnpm dev
```

Open:

- App: [http://localhost:3000](http://localhost:3000) (redirects to French)
- French: [http://localhost:3000/fr](http://localhost:3000/fr)
- German: [http://localhost:3000/de](http://localhost:3000/de)
- English: [http://localhost:3000/en](http://localhost:3000/en)
- PostgreSQL: `localhost:5432` (database/user/password: `mhp`)
- Mailpit UI: [http://localhost:8025](http://localhost:8025)
- Mailpit SMTP: `localhost:1025`

Local development uses PostgreSQL and Mailpit in Docker while Next.js runs on the host. The default payment provider is the deterministic `fake` provider; Stripe placeholders in `.env.example` are test-mode examples only.

Set `PAYMENT_PROVIDER=stripe` only with Stripe **test** keys. Never use live Stripe credentials in development or previews.

`SITE_URL` controls canonical and alternate metadata. Set it to the final absolute production origin in Vercel (for example, `https://www.example.com`). Blank or invalid values are ignored; when it is absent, deployments use Vercel's system-provided production URL and local development falls back to `http://localhost:3000`.

Staff booking list: `/{locale}/staff/bookings`, protected by an enabled `ADMIN`
session. Create the first admin with `pnpm db:bootstrap-admin` using
`BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` (at least 12 characters).
The command refuses to run when an enabled admin already exists. Guest course
checkout remains available; public self-registration and My Courses are CP-01.

## Database

```bash
pnpm db:generate  # generate a migration after schema changes
pnpm db:migrate   # apply committed migrations
pnpm db:seed              # upsert the typed course catalogue into PostgreSQL
pnpm db:bootstrap-admin   # create the first admin from BOOTSTRAP_ADMIN_* env
pnpm db:studio            # optional local Drizzle Studio
```

Bookings, payment events, waitlist entries, accounts and the course catalogue
are persisted in PostgreSQL. The public catalogue still reads
`src/features/courses/catalog.ts`; `pnpm db:migrate` then `pnpm db:seed` stores
the same rows so go-live data is not only in git. Hosted Neon on Vercel may inject `NEON_DATABASE_URL` instead of `DATABASE_URL`; the app accepts that fallback. Production and preview Vercel builds apply committed migrations (`pnpm db:migrate`) before compiling the app. Production builds also re-seed the catalogue. Local builds do not.

## Quality checks

```bash
pnpm verify       # lint, typecheck, unit tests, production build
pnpm test:e2e     # Playwright locale, SEO and fake-booking tests
```

Playwright is separate from `verify` because its browser binary is an external installation. Install Chromium once on a new machine with:

```bash
pnpm exec playwright install chromium
```

## Docker lifecycle

```bash
docker compose ps
docker compose down       # stop services, preserve data
docker compose down -v    # stop services and permanently reset local data
```

## Project guidance

- [`AGENTS.md`](./AGENTS.md) contains the repository-wide agent rules.
- [`docs/MVP.md`](./docs/MVP.md) records the implemented course baseline.
- [`docs/ROOM-BOOKING.md`](./docs/ROOM-BOOKING.md) defines accounts, roles and the approved room module.
- [`docs/IMPLEMENTATION-PLAN.md`](./docs/IMPLEMENTATION-PLAN.md) is the authoritative checkpoint/status ledger.
- [`docs/PRODUCT-VISION.md`](./docs/PRODUCT-VISION.md), [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md), and [`docs/DESIGN.md`](./docs/DESIGN.md) define the broader direction and constraints.
- [`docs/AGENT-WORKFLOW.md`](./docs/AGENT-WORKFLOW.md) defines the verification loop.

Cursor rules in `.cursor/rules/` point back to these authoritative documents.

Public URLs are locale-prefixed (`/fr`, `/de`, `/en`) with localized course slugs. Sitemap, robots, canonical and hreflang tags are generated for those routes. Valuable legacy paths 301 to the new French routes.

## Cursor Cloud Agent environment

Remote Cursor Cloud Agents use the configuration in `.cursor/`:

- [`.cursor/environment.json`](./.cursor/environment.json) — runs on the Cursor default base image, wires up the `install`/`start` hooks, exposes ports `3000` (app) and `8025` (Mailpit UI), and launches `pnpm dev` in a `next-dev` terminal.
- [`.cursor/install.sh`](./.cursor/install.sh) — idempotent bootstrap. Because the base image has no Docker, it installs PostgreSQL natively (in place of `docker compose`), installs Node dependencies, the Playwright Chromium browser, and a Mailpit binary, seeds `.env.local` from `.env.example`, creates the `mhp` role/database, and applies migrations.
- [`.cursor/start.sh`](./.cursor/start.sh) — per-boot reconciliation. Starts PostgreSQL, applies any pending migrations for the checked-out branch, and starts Mailpit. Safe to re-run.

Local development still uses `docker compose` per the steps above; the `.cursor/` scripts only provision the equivalent services inside the remote agent VM.
