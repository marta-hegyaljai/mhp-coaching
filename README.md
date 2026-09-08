# MHP Hypnose courses

Multilingual Next.js foundation for the MHP Hypnose training website. This bootstrap intentionally contains no catalogue, booking, payment, or account features.

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

`SITE_URL` controls canonical and alternate metadata. Set it to the final absolute production origin in Vercel (for example, `https://www.example.com`). Blank or invalid values are ignored; when it is absent, deployments use Vercel's system-provided production URL and local development falls back to `http://localhost:3000`.

## Database

```bash
pnpm db:generate  # generate a migration after schema changes
pnpm db:migrate   # apply committed migrations
pnpm db:seed      # currently a documented no-op
pnpm db:studio    # optional local Drizzle Studio
```

The bootstrap schema contains only a minimal migration probe. Product tables should be introduced alongside the product feature that needs them.

## Quality checks

```bash
pnpm verify       # lint, typecheck, unit tests, production build
pnpm test:e2e     # Playwright locale and language-switcher smoke tests
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
- [`docs/BOOTSTRAP-TASK.md`](./docs/BOOTSTRAP-TASK.md) defines this foundation.
- [`docs/MVP.md`](./docs/MVP.md), [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md), and [`docs/DESIGN.md`](./docs/DESIGN.md) are authoritative for subsequent product work.
- [`docs/AGENT-WORKFLOW.md`](./docs/AGENT-WORKFLOW.md) defines the verification loop.

Cursor rules in `.cursor/rules/` point back to these authoritative documents. A Cursor Cloud Agent environment file is deliberately not included until its current project-specific setup can be validated in Cursor; configuring that environment is the next infrastructure task before remote agent work.
