# MHP Hypnose — Agent Instructions

Before non-trivial work, read:
1. `docs/MVP.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DESIGN.md`
4. `docs/EMAIL.md` (binding for every transactional email)
5. `docs/AGENT-WORKFLOW.md`
6. `docs/IMPLEMENTATION-PLAN.md`
7. `docs/ROOM-BOOKING.md` for account, authorization, room, or billing work

Read `docs/PRODUCT-VISION.md` only for long-term context.

## Current priority
Preserve the implemented course MVP while expanding the product through the
ordered checkpoints in `docs/IMPLEMENTATION-PLAN.md`; use
`docs/ROOM-BOOKING.md` for binding room behavior. Do not implement unrelated
long-term course or post-launch room features unless explicitly requested.

`docs/IMPLEMENTATION-PLAN.md` is the execution source of truth. If a request says
“implement through CP-XX”, start at the first incomplete checkpoint, complete
checkpoints in order through that ID, and update the plan status and completion
evidence after each checkpoint. When no checkpoint is named, implement only the
recorded next checkpoint. Never mark a partially implemented checkpoint complete.

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

## Binding email direction
Before adding or restyling any notification, read `docs/EMAIL.md`. Compose
HTML only through `composeTransactionalEmail()` in
`src/features/email/layout.ts`. Do not hand-roll a second template. Gold is
limited to the uppercase eyebrow. Buyer confirmation shows the course venue
address, never the booking UUID.

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
- One PostgreSQL-backed account and one Stripe customer identity per person.
- Keep Courses and Rooms as separate domains in the modular monolith.
- Guest course checkout remains supported; only verified account emails may
  claim historical registrations.
- Room access is an explicit admin-granted capability. Admins cannot read
  therapists' private booking notes.
- Server Components by default.
- Public pages must be fast, crawlable and SEO-friendly.
- `/fr`, `/de`, `/en` are first-class routes.
- Mobile is first-class.
- Keep provider-specific integrations behind small adapters.
- Core business data must remain portable PostgreSQL.
- Never commit secrets.
- Never use production Stripe credentials in development or previews.

## Course MVP baseline

- Courses/prices/dates remain in typed TypeScript config until a specific
  course-admin slice replaces them.
- Guest course booking, persisted leads/payments, waitlist, email and the small
  protected staff list are implemented and must not regress.
- Accounts and available-certificate views are approved only through the shared
  account/platform roadmap.
- Do not opportunistically add a course CMS, exams, evaluations, attendance,
  packages or the complete student lifecycle.

## Definition of done
Before declaring a task complete:
1. Run `pnpm verify`.
2. Run relevant tests.
3. Run and inspect the affected flow in a browser.
4. Check ~390px mobile viewport for UI work.
5. Check FR/DE/EN for locale-sensitive work.
6. Check browser/server console for errors.
7. Update docs when behavior or architecture changes.
8. For checkpoint work, update `docs/IMPLEMENTATION-PLAN.md` status, current
   position, remaining work or completion evidence.

Do not weaken tests just to make them pass.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
