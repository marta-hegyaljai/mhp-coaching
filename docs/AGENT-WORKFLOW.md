# MHP Hypnose — Agentic Development Workflow

## Goal
Support disciplined development with Codex, Cursor Cloud Agents, and local
contributors:

Prompt → agent branch → implementation → verification → browser inspection → PR → Vercel preview → phone review → follow-up or merge.

The course MVP is the protected baseline. The approved next program is the
shared account foundation and room-booking module in
[`ROOM-BOOKING.md`](./ROOM-BOOKING.md). Work on it as ordered vertical slices;
do not attempt the complete module in one change.

[`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) is the authoritative
checkpoint ledger. It defines the current position, exact deliverables,
acceptance criteria and status-update protocol. Product prose or the summary
below must not be used as a competing roadmap.

## Loop
For every meaningful task:

1. **Understand** — read AGENTS.md + relevant docs and inspect current code.
   Visual work must follow `docs/DESIGN.md` and, for Cursor, the mirrored
   `.cursor/rules/mhp-ui.mdc` guardrail.
2. **Plan** — resolve the requested checkpoint using `IMPLEMENTATION-PLAN.md`,
   mark only the next incomplete checkpoint `IN_PROGRESS`, and preserve the live
   course MVP and the Courses/Rooms domain boundary.
3. **Implement** — keep provider code localized; prefer Server Components; keep
   UI mobile/accessibility friendly. Use forward-only migrations and explicit
   authorization at every server boundary.
4. **Verify mechanically** — run `pnpm verify` + relevant tests.
5. **Verify behavior** — run the app and exercise the changed flow. For UI inspect desktop + ~390px mobile + FR/DE/EN where relevant.
6. **Iterate** — fix what tests/browser inspection reveal.
7. **Record** — update checkpoint status/current position and append concrete
   completion evidence; if incomplete, record remaining work or the exact block.
8. **Report** — summarize changes, tests, assumptions/limitations, checkpoint
   status and preview/PR details.

Do not call work complete merely because code compiles.

## Examples of reviewable work
- Implement global shell/homepage in all locales.
- Add hardcoded course catalogue + localized course pages.
- Persist booking form submissions.
- Add FakePaymentProvider + E2E flow.
- Add Stripe Checkout behind PaymentProvider.
- Add protected booking list.
- Introduce users/sessions and verified-email course reconciliation.
- Add room capability checks and capability-aware navigation.
- Add room inventory plus admin opening-hours configuration.
- Add privacy-safe room availability read model.
- Add atomic room booking with a PostgreSQL overlap constraint.
- Add cancellation billing outcome and audit events.
- Add finalized monthly statements before Stripe charging.

The first five examples describe completed MVP slices and remain useful patterns,
not outstanding work. The platform examples are constituent work inside the
formal checkpoints; completing one bullet does not complete its checkpoint.
Avoid vague tasks such as "build the whole platform", "add room booking" or
"improve the design". Prefer “implement CP-01” or “implement through CP-05.”

## Platform safety gates

For account, room or billing changes, verification must match the risk:

- authorization tests for visitor, user, therapist and admin;
- proof that verified-email reconciliation cannot expose another person's course
  history;
- concurrent database tests for room booking/block collisions;
- owner/admin projections proving private notes are never selected or serialized;
- Zurich DST/opening-boundary tests;
- idempotency tests for reminders, finalization and Stripe webhooks;
- reconciliation of statement totals to immutable line items and adjustments; and
- regression coverage for anonymous course checkout.

Browser QA should use at least a course-only user, therapist and admin fixture.
Inspect the room calendar at desktop and around 390px, in FR/DE/EN, and verify
browser/server consoles. Never use real patient information in fixtures.

## External-system safety
Cloud agents/previews:
- no production Stripe secrets
- no production DB mutation without explicit authorization
- fake payments or Stripe test mode
- no real customer email from local/preview
- no secrets in git
- no real therapist/customer records in tests, screenshots or preview seeds
- no production month-end charge or reminder jobs

Prefer small PRs, screenshots for visual work and migrations committed with the code that needs them.
