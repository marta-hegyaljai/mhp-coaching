# Codex Task — Bootstrap the Repository

## Objective
Initialize this new repository so later work can be done reliably by Codex locally and Cursor Cloud Agents remotely.

**Do not build the course catalogue, booking system or Stripe integration in this task.** Build only the foundation.

## 1. Next.js
Initialize the existing repository root with the current stable Next.js App Router using:
- TypeScript
- pnpm
- `src/` directory
- Tailwind CSS
- ESLint
- import alias `@/*`

Use `create-next-app@latest` or equivalent current stable setup. Do not pin an obsolete version.

## 2. Internationalization
Install/configure `next-intl`.

Locales:
- `fr`
- `de`
- `en`

Required:
- `/fr`, `/de`, `/en`
- `/` redirects to `/fr`
- tiny localized starter homepage proving translations work
- language switcher
- locale-aware metadata foundation
- organized `messages/` files

Do not build real marketing/course copy yet.

## 3. Local infrastructure
Create `docker-compose.yml` with:
1. PostgreSQL
2. Mailpit

Use sensible named volumes/healthchecks.
Do not require Docker for the Next.js dev process; run `pnpm dev` on the host.

## 4. Database foundation
Add Drizzle ORM/Kit + a standard PostgreSQL driver.
Create:
- `src/db/index.ts`
- `src/db/schema.ts`
- `drizzle.config.ts`
- migration folder

Add scripts:
- `db:generate`
- `db:migrate`
- `db:studio` if reasonable
- `db:seed` (may initially be no-op/simple)

Do not design the full booking schema in this task unless needed to prove migration/connection.

## 5. Environment
Add `.env.example` documenting local values for:
- `DATABASE_URL`
- Mailpit/SMTP
- `PAYMENT_PROVIDER=fake`
- placeholders for Stripe **test** variables, no secrets

Ignore real env files/secrets correctly.

## 6. Quality foundation
Set up:
- `typecheck`
- lint
- Vitest (unless a better current default is clearly justified)
- Playwright
- minimal locale smoke E2E test
- `pnpm verify`

`pnpm verify` must at least run:
- lint
- typecheck
- unit tests
- production build

If E2E is separate because browser installation would make basic verification awkward, expose `pnpm test:e2e` and explain this clearly.

## 7. README
Write exact fresh-clone instructions, approximately:

```bash
pnpm install
cp .env.example .env.local
docker compose up -d
pnpm db:migrate
pnpm dev
```

Document:
- app/Postgres/Mailpit URLs
- stopping/resetting Docker services
- tests + verification
- docs location

## 8. Cursor readiness
Preserve `AGENTS.md` and docs.
Create concise `.cursor/rules/*.mdc` rules for:
- product/MVP scope
- architecture
- design
- testing/definition of done

Rules should point to authoritative docs instead of duplicating everything.

If current Cursor Cloud environment configuration cannot be verified confidently, do not invent syntax; leave a clearly documented next task.

## Acceptance criteria
Complete only when:
1. dependencies install,
2. PostgreSQL + Mailpit start,
3. migrations run locally,
4. `/fr`, `/de`, `/en` render,
5. language switcher works,
6. `pnpm verify` passes,
7. Playwright locale smoke passes,
8. production build passes,
9. README is usable from a fresh clone,
10. git status contains no secrets/generated junk that should not be committed.

## Final Codex report
Report:
- structure/files created
- important dependency choices
- exact commands/tests run and results
- deliberate deviations/assumptions
- next recommended task

Do **not** start Course Catalogue implementation during bootstrap.
