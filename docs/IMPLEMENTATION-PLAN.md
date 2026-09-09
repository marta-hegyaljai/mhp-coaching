# MHP Platform — Checkpoint Implementation Plan

## Purpose

This is the execution source of truth for the MHP Platform roadmap. Product
behavior belongs in [`MVP.md`](./MVP.md) and
[`ROOM-BOOKING.md`](./ROOM-BOOKING.md); architecture and UI constraints belong
in [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`DESIGN.md`](./DESIGN.md). This
file answers three operational questions:

1. What has actually been completed?
2. What is the next permitted checkpoint?
3. What exact user-usable result makes that checkpoint complete?

Future requests may say **“Implement through CP-05”**. That means: begin at the
first checkpoint not marked `COMPLETE`, implement every checkpoint in numerical
order through CP-05 inclusive, and stop there. Do not skip dependencies or pull
later scope forward.

## Current position

| Field | Value |
| --- | --- |
| Plan revision | 1 |
| Last updated | 2026-09-09 |
| Last completed checkpoint | CP-00 |
| Next checkpoint | CP-01 |
| Active checkpoint | None |
| Room module production status | Not started |

## Status vocabulary

Use exactly one of these values:

- `COMPLETE` — every acceptance criterion and the repository definition of done
  passed; completion evidence is recorded here.
- `IN_PROGRESS` — implementation started but the checkpoint is not usable or not
  fully verified. The remaining work and blocker, if any, must be recorded.
- `BLOCKED` — work cannot proceed without a named decision, credential or external
  action. Record the precise unblock condition.
- `PLANNED` — no implementation has started.

Only one checkpoint may be `IN_PROGRESS`. A later checkpoint cannot become
`IN_PROGRESS` or `COMPLETE` while an earlier one is incomplete. Preparatory code
for a checkpoint is part of that checkpoint and is not independently complete.

## How agents must use this plan

At the start of any platform implementation task:

1. Read the required repository docs and this file completely.
2. Inspect the code, migrations and tests that relate to the recorded current
   position. The code is evidence; do not blindly trust a stale status row.
3. Resolve the requested target checkpoint. If none is named, implement only the
   `Next checkpoint` unless the user explicitly asks for a smaller scope.
4. Change that checkpoint to `IN_PROGRESS`, update `Active checkpoint`, and keep
   its included/excluded scope intact.
5. Implement the smallest complete vertical slice. Infrastructure, migrations,
   authorization, localized UI and tests ship together with the user outcome.
6. Run the checkpoint acceptance criteria and the global definition of done.
7. If everything passes, mark it `COMPLETE`, advance `Last completed checkpoint`
   and `Next checkpoint`, clear `Active checkpoint`, and append a completion-log
   entry with concrete evidence.
8. If work stops early, leave it `IN_PROGRESS` or `BLOCKED` and add a **Remaining**
   subsection. Never describe partial work as complete.

When a task requests “through” a later checkpoint, repeat steps 4–7 separately
for each checkpoint. Commit/PR boundaries may align one checkpoint per change;
do not combine statuses or provide one vague completion entry for several.

If implementation discovers that an acceptance criterion must change, update the
product/architecture docs first and record a plan-revision note. Do not silently
weaken a checkpoint to make existing code pass. New scope belongs in a new
checkpoint or an explicitly approved revision, never hidden inside a completion
log.

## Definition of checkpoint complete

Every checkpoint below inherits these gates:

- its stated user/admin workflow works end-to-end with realistic local fixtures;
- authorization is enforced server-side, including negative-role tests;
- migrations are forward-only, committed and successfully applied to a fresh
  local database as well as an upgraded database when existing data is affected;
- FR/DE/EN behavior is implemented, even while the public language control is
  hidden;
- affected UI is inspected in a browser at desktop and approximately 390px;
- relevant browser and server consoles contain no errors;
- relevant unit/integration/E2E tests and `pnpm verify` pass;
- guest course discovery, waitlist and checkout do not regress;
- behavior/architecture docs and this plan reflect the finished implementation;
  and
- no production credentials, real patient data or private notes enter fixtures,
  logs, screenshots or commits.

A checkpoint is a releasable product increment. A schema, API, placeholder page
or navigation link alone is not a deliverable checkpoint.

## Checkpoint summary

| ID | Status | Deliverable | Primary user |
| --- | --- | --- | --- |
| CP-00 | COMPLETE | Reliable multilingual course-booking MVP | Visitor and staff |
| CP-01 | PLANNED | Secure account and “My courses” experience | User |
| CP-02 | PLANNED | Account-based user/access administration | Admin |
| CP-03 | PLANNED | Personal certificate library | User and admin |
| CP-04 | PLANNED | Configurable rooms and privacy-safe availability | Therapist and admin |
| CP-05 | PLANNED | Collision-safe room reservation and “My bookings” | Therapist |
| CP-06 | PLANNED | Booking changes, cancellation and admin intervention | Therapist and admin |
| CP-07 | PLANNED | Owner-only notes and unavailable-time requests | Therapist and admin |
| CP-08 | PLANNED | Discounts and transparent current-month usage | Therapist and admin |
| CP-09 | PLANNED | Stable monthly statements and saved payment method | Therapist and admin |
| CP-10 | PLANNED | Automated monthly charging and operational email | Therapist and admin |
| CP-11 | PLANNED | Production-ready room module on the app domain | All actors |

---

## CP-00 — Course MVP baseline

**Status:** `COMPLETE`

**User-usable outcome:** Visitors can discover and book dated courses without an
account, join undated-course waitlists, pay through fake/Stripe checkout and
receive confirmation. Staff can inspect/export bookings and waitlists.

**Implemented scope:** Localized public routes and SEO, course catalogue/calendar,
guest booking leads and postal address, PostgreSQL persistence, fake and Stripe
payment providers, authoritative webhook handling, waitlist, payment-help/contact
email, legal content, Mailpit/Resend transport and Basic-Auth staff lists/CSV.

**Completion evidence:** Existing application and migrations inspected on
2026-09-09. `pnpm verify` passed with 25 test files and 68 tests, including a
successful Next.js production build. Existing Playwright suites cover localized,
course-card, phone-layout and fake-booking flows.

**Not included:** User accounts, role/capability administration, personal course
area/certificates and all room-domain functionality.

---

## CP-01 — Secure accounts and My Courses

**Status:** `PLANNED`

**Depends on:** CP-00.

**User-usable outcome:** A person can create and verify one MHP account, sign in,
recover access, manage a basic profile, and see their own upcoming and past course
registrations. Guest course checkout remains available.

**Included:**

- PostgreSQL users, normalized unique email identities, credentials, verification
  and recovery tokens, revocable sessions and minimum profile fields;
- strong password hashing, secure cookie/session handling, expiry, logout,
  rate-limited auth/recovery and applicable CSRF protection;
- localized sign-up, verification, sign-in, sign-out, forgot/reset-password,
  profile and My Courses screens;
- nullable user ownership on existing course bookings without overwriting their
  submitted email snapshot;
- idempotent linking of historical registrations only after the account email is
  verified, using documented normalization and case-insensitive matching;
- automatic ownership for new signed-in course bookings while preserving guest
  booking; and
- a safe documented bootstrap mechanism for the first admin account, needed by
  CP-02, without committing credentials.

**Explicitly excluded:** Therapist access management, room UI, certificates,
course CMS and social login.

**Acceptance criteria:**

1. A new user completes verification, signs in/out and resets a password in each
   locale.
2. Before email verification, no historical registration is returned or linked.
3. After verification, only matching normalized-email registrations appear and
   the reconciliation is safe to retry.
4. Upcoming and past classification is correct at Zurich date boundaries.
5. A signed-in booking links to that user; a guest can still complete the original
   flow without being forced to register.
6. Changing a profile email cannot claim another history without verifying and
   reconciling that new address.
7. Session revocation, cross-user access denial, token expiry/reuse and auth rate
   limits have automated coverage.

---

## CP-02 — Admin user and access management

**Status:** `PLANNED`

**Depends on:** CP-01.

**Admin-usable outcome:** An authenticated admin can create/invite users, disable
or re-enable them, grant/revoke therapist access and operate the existing course
staff screens through the shared account system.

**Included:**

- explicit `ADMIN` role and `ROOM_BOOKING` capability with centralized policy
  checks;
- localized admin user list/detail, invitation, disable/enable and capability
  controls;
- invitation and password-setup flow for selected therapists; no public therapist
  registration;
- audit events for user lifecycle, admin-role changes and room-access changes;
- immediate session revocation on user disable and immediate server-side denial
  when room access is revoked;
- capability-aware authenticated navigation; and
- migration of staff booking/waitlist pages and CSV exports from HTTP Basic Auth
  to the `ADMIN` role, followed by removal of the old credential path.

**Explicitly excluded:** Room inventory/availability, room bookings, broad course
administration and permission customization beyond the two defined controls.

**Acceptance criteria:**

1. An admin can invite a user who sets a password and signs in successfully.
2. An admin can grant/revoke `ROOM_BOOKING`; a normal user cannot grant it or
   access admin routes/actions.
3. A disabled user loses active sessions and cannot authenticate until re-enabled.
4. Course-only users do not see Rooms; enabled therapists do see the module entry.
5. Existing staff lists/exports work for admins and reject users/therapists.
6. The old Basic-Auth secret and authorization path are no longer required.
7. Every access-changing action records actor, target, before/after and time.

---

## CP-03 — Personal certificate library

**Status:** `PLANNED`

**Depends on:** CP-02.

**User/admin-usable outcome:** A user can see their own issued course certificate
records in My Courses and securely open/download an available certificate; an
admin can attach, replace or revoke an existing certificate for a user.

**Included:**

- course-certificate ownership, course/title/issue-date snapshots, status and
  optional secure PDF document;
- initial PDF storage in PostgreSQL `bytea`, capped at 10 MiB and served only
  through an authorized dynamic response. Keep document access behind a small
  repository interface so object storage can replace it later without changing
  certificate ownership or UI;
- owner-only authenticated certificate list and download authorization;
- minimal admin attach/replace/revoke workflow and audit history; and
- a user-visible unavailable-document state that preserves certificate metadata.

**Explicitly excluded:** Diploma eligibility, automatic generation, templates,
exams, evaluations, qualification progress and public verification.

**Acceptance criteria:**

1. A user sees only their own certificate records and can download only their own
   active PDF document.
2. An admin can attach and revoke a certificate; revocation immediately prevents
   user download while retaining history.
3. Guessing or changing a certificate/document ID cannot cross account boundaries.
4. Documents are validated as PDFs no larger than 10 MiB; they are not public
   URLs, indexed pages, email attachments or stored in git.
5. Missing files fail safely and visibly without exposing storage internals.

---

## CP-04 — Rooms, rules and availability

**Status:** `PLANNED`

**Depends on:** CP-03.

**Therapist/admin-usable outcome:** Admins can configure real room inventory,
prices, opening hours and temporary blocks; therapists can use a privacy-safe day
or week calendar to see when rooms are available.

**Included:**

- rooms with CHF hourly rate, description, active state and display order;
- configurable weekly opening intervals and booking rules with
  `Europe/Zurich` as the authoritative timezone;
- temporary room blocks with reason and creator;
- admin Rooms and Settings screens for create/edit/disable, price, hours, rules
  and blocks;
- therapist day/week availability calendar with room filters and explicit
  available/booked/unavailable/my-booking presentation; and
- separate minimal therapist/admin availability projections that never return
  another user's identity or sensitive fields.

Because CP-05 has not yet shipped, fixture/admin-created test reservations may be
used to prove booked-state privacy, but no fake reservation control may appear in
production UI.

**Explicitly excluded:** Therapist-created reservations, monthly billing,
discounts and private notes.

**Acceptance criteria:**

1. An admin can create, reorder, price, disable and re-enable a room.
2. An admin can configure each weekday, closed days, interval/min/max/advance
   rules and a temporary block.
3. An enabled therapist sees accurate day/week availability; a normal user is
   denied the route and data.
4. Closed time, disabled rooms and blocks are unavailable at exact boundaries.
5. Another user's reserved interval contains only the generic `Booked` state in
   the therapist response; identity and notes are absent, not client-hidden.
6. Zurich DST gap/overlap cases are deterministic and invalid local selections are
   rejected.
7. Creating a block over an existing reservation reports the conflict and does
   not silently invalidate it.

---

## CP-05 — Reserve a room and My Bookings

**Status:** `PLANNED`

**Depends on:** CP-04.

**Therapist-usable outcome:** An enabled therapist can choose an available room
and time, see the exact price, confirm an immediately reserved booking, and see
upcoming bookings and history. No payment occurs at booking time.

**Included:**

- room-booking persistence with `CONFIRMED`/`CANCELLED` lifecycle, creator,
  Zurich-safe instants and immutable room/rate/discount/duration/amount snapshots;
- server-side permission, room, opening-hour, rule, block, price and availability
  calculation;
- PostgreSQL-level protection against overlapping active bookings plus
  transactional block protection;
- localized calendar-to-confirmation flow with explicit CHF calculation and
  monthly-billing explanation; and
- My Bookings upcoming/history views and an own-booking calendar state.

Discount configuration is delivered in CP-08; until then the snapshotted discount
is zero. The schema/calculation path must already support that value.

**Explicitly excluded:** Modification, cancellation controls, admin-created
bookings, private notes, availability requests and payment collection.

**Acceptance criteria:**

1. An enabled therapist can reserve a valid interval and immediately see it in
   their calendar and upcoming list with the server-calculated amount.
2. Invalid duration/increment/advance/opening/block/disabled-room selections fail
   without creating a booking.
3. Two concurrent attempts for the same room/interval cannot both succeed; the
   loser gets a localized recoverable conflict response.
4. Overlap boundaries allow adjacent bookings but reject every actual overlap.
5. Browser-supplied user, role, rate, discount or amount changes have no effect.
6. Other therapists see only `Booked`; the owner sees the management-safe details.
7. No Stripe checkout/payment is created during reservation.

---

## CP-06 — Changes, cancellations and admin intervention

**Status:** `PLANNED`

**Depends on:** CP-05.

**Therapist/admin-usable outcome:** Therapists can safely change or cancel their
bookings, including a clear late-charge warning. Admins can create a booking for
a user, move/cancel bookings and waive a late charge.

**Included:**

- owner modification of room/start/end with atomic collision/rule checks;
- configurable cancellation notice (initial default 48 hours), free cancellation,
  chargeable late cancellation and explicit admin waiver as separate billing
  outcomes;
- exact late-cancellation confirmation amount and immediate slot release;
- admin booking-on-behalf, reschedule, cancel and waiver tools;
- user email for admin-created/admin-moved bookings through the shared transport;
  and
- append-only booking audit history with before/after, actor and timestamp.

**Explicitly excluded:** Private notes, request inbox, monthly statement charging
and automatic reminders.

**Acceptance criteria:**

1. An owner can move an eligible booking to another available room/time; all
   original creation rules and collision guarantees still apply.
2. A free cancellation releases inventory and yields no charge; a late
   cancellation releases inventory and retains the displayed snapshot amount.
3. Modification inside the notice window cannot bypass the late-cancellation
   policy.
4. An admin can create/move/cancel for a user and waive a late charge, with the
   result visible to that user.
5. Normal users, other therapists and browser-supplied actor IDs cannot perform
   these operations.
6. No booking is deleted, and audit history accurately reconstructs every change.

---

## CP-07 — Private notes and no-availability requests

**Status:** `PLANNED`

**Depends on:** CP-06.

**Therapist/admin-usable outcome:** A therapist can keep an owner-only personal
reminder on a booking and request an unavailable time. Admins can resolve requests
without ever gaining access to private notes.

**Included:**

- separately stored application-encrypted private notes with managed-key
  configuration and owner-only create/edit/delete;
- privacy warning prohibiting medical records/detailed clinical information;
- structural query/serializer boundaries keeping notes out of calendar, admin,
  billing, exports, email, logs, analytics and error reporting;
- no-availability request form with interval, preferred/any room, optional
  admin-visible message and patient-information warning;
- therapist request history with `OPEN`, `RESOLVED`, `DECLINED`; and
- admin request inbox, internal admin note and resolve/decline flow. Requests do
  not reserve inventory and no automatic rearrangement is added.

**Acceptance criteria:**

1. Only the booking owner can read or mutate a private note; admin and other
   therapist requests return no note field or content.
2. Automated tests inspect calendar/admin/billing/export/email payloads and logs
   to prove private-note exclusion.
3. Encryption-at-rest and key-misconfiguration behavior are tested; plaintext
   note text is not stored in the ordinary booking row.
4. When no room is available, a therapist can submit a request and see its status
   while the original slot remains unreserved.
5. An admin can resolve/decline a request and the therapist sees the outcome.
6. Users can distinguish private note content from admin-visible request messages.

---

## CP-08 — Discounts and current-month usage

**Status:** `PLANNED`

**Depends on:** CP-07.

**Therapist/admin-usable outcome:** Therapists can understand their accumulated
room use and estimated amount for the open month; admins can configure discounts
and inspect/export current totals across users.

**Included:**

- one percentage room discount per user, initially applying across all rooms;
- audit history for discount changes and snapshot application only to newly
  created bookings;
- current-month per-room minutes, amount and booking-level breakdown for the user;
- admin current-month totals, per-user drill-down and CSV export;
- completed use, free cancellation, late charge and waiver projection rules; and
- explicit “current/open—not finalized” labeling.

**Explicitly excluded:** Credits, historical finalized statements and charging.

**Acceptance criteria:**

1. A new booking snapshots the current discount after base room price and shows
   the correct effective hourly rate and amount.
2. Later price/discount changes do not alter existing booking snapshots.
3. Current user and admin totals reconcile exactly to included booking outcomes,
   including late cancellations and waivers.
4. A therapist sees only their usage; admin CSV matches the on-screen totals and
   contains no private-note data.
5. Fractional-hour rounding is deterministic, documented and tested in integer
   minor units/minutes.

---

## CP-09 — Monthly statements and payment method

**Status:** `PLANNED`

**Depends on:** CP-08.

**Therapist/admin-usable outcome:** Therapists can save/update a Stripe payment
method and browse stable historical monthly statements. Admins can finalize a
month and make explicit adjustments without rewriting history.

**Included:**

- one shared Stripe customer reference per user and SetupIntent-based payment
  method management; no raw card data in MHP systems;
- statement/line-item model and lifecycle through `OPEN` and `FINALIZED`;
- idempotent admin finalization preview/confirmation, immutable booking-derived
  line items and totals;
- explicit admin adjustment/waiver line items with actor, reason and audit trail;
- therapist statement history/detail and admin per-user/month detail/CSV; and
- handling for no payment method and zero-total statements.

**Explicitly excluded:** Automatic scheduled finalization, charging, payment
retries/dunning and credits.

**Acceptance criteria:**

1. A therapist can securely add/replace a payment method and sees only safe Stripe
   display metadata.
2. Finalizing the same user/month twice is idempotent and produces one immutable
   statement whose total equals its line items.
3. Room-price, discount, booking and settings changes after finalization do not
   alter that statement.
4. Corrections appear only as explicit reasoned adjustments; original line items
   remain unchanged.
5. Owner/admin authorization protects statement reads and exports, which contain
   no private notes.

---

## CP-10 — Automated charging, reminders and email evidence

**Status:** `PLANNED`

**Depends on:** CP-09.

**Therapist/admin-usable outcome:** Month-end statements are safely finalized and
charged, payment outcomes are visible and actionable, and users receive reliable
booking/account/billing email with internal delivery evidence.

**Included:**

- idempotent scheduled month-close/finalization and Stripe PaymentIntent creation
  from the stored finalized amount;
- lifecycle `FINALIZED → PAYMENT_PENDING → PAID | PAYMENT_FAILED` with signed,
  replay-safe Stripe webhooks as authority;
- failed-payment user/admin states and update-payment-method action, without
  automatic account disablement;
- React Email templates for account, booking, request, reminder and billing events
  defined in the room specification;
- configurable 24-hour initial reminder scheduling; and
- PostgreSQL notification attempts, provider references, delivery state and
  idempotency keys, with private-note exclusion.

**Explicitly excluded:** Advanced automatic retries/dunning, credits, accounting
integration and SMS/push notifications.

**Acceptance criteria:**

1. A finalized statement creates at most one intended charge despite job retry or
   concurrent execution; amount comes only from the stored statement.
2. Valid signed webhook events advance state idempotently; browser returns,
   unsigned events and replays cannot falsely mark payment paid.
3. Success and failure are visible to user/admin; failure sends an actionable
   update-payment-method message and does not automatically disable access.
4. Reminders send once at the configured time and are safe under scheduler retry.
5. Staff can determine whether each required notification was attempted/delivered
   without searching Resend.
6. Mailpit captures all local/test mail, production recipients are impossible in
   previews, and no email/log contains a private booking note.

---

## CP-11 — Production launch and operational handoff

**Status:** `PLANNED`

**Depends on:** CP-10.

**User-usable outcome:** Approved therapists and admins can use the complete room
workflow safely on `app.mhp-coaching.ch`, while public course booking remains
available on the marketing origin.

**Included:**

- production domain/routing, private-page noindex behavior and capability-aware
  navigation from the marketing site;
- production Neon migrations, backups/restore rehearsal and rollback plan;
- Stripe live-mode configuration only in production, webhook health and controlled
  first statement/charge rehearsal with authorized test business records;
- Resend domain/configuration, scheduler observability and failure alerting;
- Swiss privacy/retention review, security review and accessibility pass;
- load/concurrency checks for availability/booking and timezone/DST production
  scenarios;
- admin operating guide for invitations, rooms, blocks, requests, waivers,
  statements, failures and notification evidence; and
- launch checklist, monitoring and post-launch ownership.

**Explicitly excluded:** Credits, recurring bookings, calendar integrations,
advanced analytics/dunning, multiple centers, native apps and patient management.

**Acceptance criteria:**

1. A production-invited therapist completes login → availability → booking →
   change/cancel → request → usage/payment-method/statement flows on desktop and
   phone in FR/DE/EN.
2. An admin completes every documented operational workflow without Basic Auth.
3. Course guest checkout, Stripe course payment, email, SEO and staff data remain
   healthy on their intended origin.
4. Production authorization/privacy/concurrency/webhook checks pass; another
   therapist's identity and all private notes remain undisclosed.
5. Backup restore and rollback procedures are rehearsed and documented.
6. Monitoring identifies failed jobs, webhooks, email and payments with a named
   response procedure.

---

## Post-launch backlog — not checkpoints

These items are intentionally outside CP-00 through CP-11 and must not be pulled
into an implementation request unless explicitly approved: minute-based free-hour
credits and ledger, recurring bookings, utilization analytics, Google/Apple
calendar integration, automatic rearrangement, advanced dunning, multiple
centers, native apps, patient management, course CMS, attendance, evaluations,
exams and automatic diploma generation.

## Completion log

Append one entry per completed checkpoint. Never delete earlier entries; correct
mistakes with a new dated note.

Use this exact shape so the next agent can audit it quickly:

```markdown
### CP-XX — YYYY-MM-DD

- **Result:** User-visible capability delivered.
- **Routes/UI:** Paths and roles exercised.
- **Migrations:** Migration names, or “None”.
- **Automated evidence:** Commands and exact pass counts/results.
- **Browser evidence:** Desktop/~390px and FR/DE/EN flows checked.
- **Preview/production:** URL or “Not deployed in this task”.
- **Deviations/follow-ups:** Approved differences or “None”.
- **Known next work:** Next checkpoint ID and title.
```

For an incomplete checkpoint, add this directly below its acceptance criteria:

```markdown
**Remaining (updated YYYY-MM-DD):**

- Finished: exact working portions.
- Remaining: exact unsatisfied criteria/files/flows.
- Blocked by: decision, credential or external action, or “None”.
- Last verification: commands and results.
```

### CP-00 — 2026-09-09

- **Result:** Existing multilingual course MVP recorded as the protected baseline.
- **Migrations:** `0000_bootstrap.sql` through `0003_waitlist.sql` already present.
- **Automated evidence:** `pnpm verify` passed; 25 test files and 68 tests passed;
  production build generated successfully.
- **Browser evidence:** Existing Playwright suites cover locale, phone layout,
  course cards and fake booking. No new UI was introduced by the planning update.
- **Known next work:** CP-01 secure accounts and My Courses.

## Plan revision log

### Revision 1 — 2026-09-09

- Replaced the coarse room delivery list with user-usable checkpoints CP-00–CP-11.
- Established mandatory status transitions, completion evidence and the meaning
  of “implement through checkpoint X.”
- Kept course certificates as a minimal owned-document library; automatic diploma
  generation and eligibility remain post-launch.
