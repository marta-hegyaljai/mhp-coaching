# MHP Hypnose — Agent Instructions

Before non-trivial work, read:
1. `docs/MVP.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DESIGN.md`
4. `docs/AGENT-WORKFLOW.md`

Read `docs/PRODUCT-VISION.md` only for long-term context.

## Current priority
Ship the MVP quickly enough to replace the unreliable legacy site and stop lost bookings. Do not implement long-term features unless explicitly requested.

## Binding UI direction
Before any visual or component work, read `docs/DESIGN.md`. The public UI uses
a pure-white and black foundation with gold limited to primary CTA hover and
small editorial eyebrow labels; it is minimalist,
mildly brutalist, and classy. Do not introduce beige/cream surfaces, bronze or
brown, shadows, decorative animation, hidden phone navigation, long full-width
option lists, or locale-dependent control shifts.
Course/date possibilities use compact bordered card grids. The language
switcher remains a fixed-width dropdown. These rules apply to Codex and all
other coding agents.

## Stack
- Next.js App Router + TypeScript
- pnpm
- Tailwind CSS
- next-intl (`fr`, `de`, `en`)
- PostgreSQL + Drizzle ORM
- Stripe for TWINT + Visa/Mastercard
- Vercel hosting/previews
- Neon PostgreSQL hosted, plain PostgreSQL locally
- Docker Compose for local PostgreSQL + Mailpit

## Principles
- One Next.js app. No microservices.
- Server Components by default.
- Public pages must be fast, crawlable and SEO-friendly.
- `/fr`, `/de`, `/en` are first-class routes.
- Mobile is first-class.
- Keep provider-specific integrations behind small adapters.
- Core business data must remain portable PostgreSQL.
- Never commit secrets.
- Never use production Stripe credentials in development or previews.

## MVP discipline
For MVP:
- Courses/prices/dates may be hardcoded in typed TypeScript config.
- No CMS/admin editor for courses.
- No student account.
- No diploma/exam/evaluation/attendance system.
- Persist bookings and payment state.
- Provide a small protected staff booking list later.

## Definition of done
Before declaring a task complete:
1. Run `pnpm verify`.
2. Run relevant tests.
3. Run and inspect the affected flow in a browser.
4. Check ~390px mobile viewport for UI work.
5. Check FR/DE/EN for locale-sensitive work.
6. Check browser/server console for errors.
7. Update docs when behavior or architecture changes.

Do not weaken tests just to make them pass.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
