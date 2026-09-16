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
| Plan revision | 3 |
| Last updated | 2026-09-16 |
| Last completed checkpoint | CP-11 |
| Next checkpoint | — |
| Active checkpoint | — |
| Room module production status | Complete through CP-11. Production domain attach, live Stripe first charge and Neon restore rehearsal remain operator steps in docs/LAUNCH.md |

Revision 3 completed CP-03 and CP-04 before CP-01 on this branch. CP-01 has now
landed on main and is merged here. CP-00 through CP-11 are complete. Remaining
work is production credential attach (Neon restore rehearsal, live Stripe first
charge, DNS) documented in LAUNCH.md — not a new checkpoint.

Extra-roadmap (2026-09-14): a free 15-minute course advice call and written
question flow shipped on course detail and booking pages, with admin-managed
Zurich hours and collision-safe slots. This is course-domain work, not a new
checkpoint.

Extra-roadmap (2026-09-16): the advice call is now also offered without a
course, on the shareable `/advice` (`/fr/conseil`, `/de/beratung`) page reached
from the home page and the footer. It reuses the same admin-managed hours,
15-minute slots and emails; `course_calls.course_id` was already nullable, so
no migration was needed. This is course-domain work, not a new checkpoint.

Extra-roadmap (2026-09-15): course registration now requires date of birth in
addition to first name, last name, email and postal address. The date is
validated as a real past calendar day and stored on the booking snapshot.
This is course-domain work, not a new checkpoint.

Extra-roadmap (2026-09-15): Café Supervision is a new public catalogue
category for continuing professional development / group supervision, not a
standard training module. Content is adapted from the historical Supervision
de groupe page. Individual visio evening dates are ordinary `course_sessions`
(capacity 10) so staff can publish or retire each one; complimentary
registration skips Stripe. This is course-domain work, not a new checkpoint.

Extra-roadmap (2026-09-15): admin course sessions can be deleted when they
have no enrolments; dates with bookings stay in history and can only be
deactivated. Public catalogue categories with no published courses are
hidden. This is course-domain work, not a new checkpoint.

Extra-roadmap (2026-09-15): course detail waitlists follow three public states.
Dated courses with seats keep purchase as the primary action and show remaining
seats only when one or two are left. A full session switches that date to a
per-session waiting list and checkout is refused. Undated published courses
use “dates coming soon” / notify-me copy. Waitlist rows store optional session,
consent and a staff notified flag. This is course-domain work, not a new
checkpoint.

Extra-roadmap (2026-09-15): course and session availability is admin-defined
(`auto`, available, full, dates pending, registration closed). The public CTA
follows that status so the school can change availability without a developer.
`auto` keeps the occupancy/dates derivation. Occupancy still refuses checkout
when seats are gone. This is course-domain work, not a new checkpoint.

Extra-roadmap (2026-09-16): course registration drafts persist in sessionStorage
so a visitor can open AGB/privacy (new tab) or navigate away and return without
retyping. Drafts expire after 24 hours and per-course drafts are cleared after a
successful booking. Last known contact stays available to prefill a later
enrolment. Signed-in checkout also hydrates missing address and date of birth
from the person’s latest booking. This is course-domain work, not a new
checkpoint.

Extra-roadmap (2026-09-16): Magie, rire & Hypnose is a published Atelier
pratique (CHF 300, 1 day, capacity 12). The course ships without sessions so
staff can add dates in admin; the public page stays on dates-coming-soon /
notify-me until then. This is course-domain work, not a new checkpoint.


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
`IN_PROGRESS` or `COMPLETE` while an earlier one is incomplete, except where an
approved plan revision records an explicit ordering exception. Preparatory code
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
| CP-01 | COMPLETE | Secure account and “My courses” experience | User |
| CP-02 | COMPLETE | Account-based user/access administration | Admin |
| CP-03 | COMPLETE | Personal certificate library | User and admin |
| CP-04 | COMPLETE | Configurable rooms and privacy-safe availability | Therapist and admin |
| CP-05 | COMPLETE | Collision-safe room reservation and “My bookings” | Therapist |
| CP-06 | COMPLETE | Booking changes, cancellation and admin intervention | Therapist and admin |
| CP-07 | COMPLETE | Owner-only notes and unavailable-time requests | Therapist and admin |
| CP-08 | COMPLETE | Discounts and transparent current-month usage | Therapist and admin |
| CP-09 | COMPLETE | Stable monthly statements and saved payment method | Therapist and admin |
| CP-10 | COMPLETE | Automated monthly charging and operational email | Therapist and admin |
| CP-11 | COMPLETE | Production-ready room module on the app domain | All actors |

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

**Status:** `COMPLETE`

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
6. Account email is permanent: the profile page displays it as read-only and
   the server ignores attempts to change it.
7. Session revocation, cross-user access denial, token expiry/reuse and auth rate
   limits have automated coverage.

**Completion evidence:** See the 2026-09-10 CP-01 completion-log entry.

---

## CP-02 — Admin user and access management

**Status:** `COMPLETE`

**Depends on:** CP-00. The invitation-only account, session and bootstrap
foundation that CP-01 listed as a prerequisite is delivered here so staff can
operate CP-00 go-live without HTTP Basic Auth. CP-01 remains public self-registration,
profile, My Courses and historical booking reconciliation.

**Admin-usable outcome:** An authenticated admin can create/invite users, disable
or re-enable them, grant/revoke therapist access and operate the existing course
staff screens through the shared account system.

**Included:**

- explicit `ADMIN` role and `ROOM_BOOKING` capability with centralized policy
  checks;
- localized admin user list/detail, invitation, disable/enable and capability
  controls, with email as the unique identifier, directory search, status/access
  filters and server-side pagination;
- invitation and password-setup flow for selected therapists; no public therapist
  registration;
- audit events for user lifecycle, admin-role changes and room-access changes;
- immediate session revocation on user disable and immediate server-side denial
  when room access is revoked;
- capability-aware authenticated navigation;
- migration of staff booking/waitlist pages and CSV exports from HTTP Basic Auth
  to the `ADMIN` role, followed by removal of the old credential path; and
- PostgreSQL persistence of the current hardcoded course catalogue and sessions
  (same ids, copy, prices, published flags and Fribourg dates) so go-live data is
  not only in source. Public catalogue reads stay on the typed seed until a later
  course-admin slice; this checkpoint does not add a course CMS.

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

**Completion evidence:** Implementation and verification on 2026-09-10.
Invitation-only PostgreSQL accounts, hashed sessions, hashed invite tokens,
bootstrap-admin CLI (refuses if an enabled admin already exists), admin
user/access UI, audit events, staff-list migration off HTTP Basic Auth, and
PostgreSQL persistence of the hardcoded course catalogue (20 courses, 14
sessions; public pages still read the TypeScript seed). Follow-up the same day:
admin directory search/filter/pagination, explicit Manage access/disable
controls, and unique-email enforcement (normalized unique index plus
application handling). `pnpm verify` passed with 34 test files and 109 tests,
including a successful Next.js production build. Playwright: 58 passed, including
`tests/e2e/auth-guards.spec.ts`. Browser inspection covered admin invite →
Mailpit → password setup, therapist Rooms vs Access denied, staff bookings,
FR/DE/EN sign-in, ~390px header, directory search/filter/pagination, Manage
access, and disable/re-enable.

**Not included:** Public self-registration, profile, My Courses, historical
booking reconciliation (CP-01), room inventory, and a course CMS.

---

## CP-03 — Personal certificate library

**Status:** `COMPLETE`

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

**Completion evidence:** Implementation and verification on 2026-09-10.
PostgreSQL `course_certificates` and `course_certificate_documents` (PDF
`bytea`, 10 MiB cap), document-store interface, owner-only My Courses list and
authenticated download, admin attach/replace/revoke with audit events, and a
visible unavailable/revoked state. `pnpm verify` passed with 38 test files and
130 tests, including a successful Next.js production build. Playwright: 60
passed, including `/account/courses` and certificate download 401. Browser:
desktop and ~390px in FR, DE, and EN for My courses and admin attach.

**Not included:** Diploma eligibility, automatic generation, templates, exams,
evaluations, qualification progress, public verification, and CP-01 course
registration history on My Courses.

---

## CP-04 — Rooms, rules and availability

**Status:** `COMPLETE`

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

**Completion evidence:** Implementation and verification on 2026-09-10.
Rooms, opening intervals, booking-settings singleton (timezone locked to
`Europe/Zurich`), temporary blocks, and confirmed-booking occupancy with a
PostgreSQL exclusion constraint. Admin `/admin/rooms` and `/admin/settings`;
therapist day/week calendar at `/{locale}/rooms` (`/fr/salles`, `/de/raeume`)
with Available / Booked / Unavailable / My booking states. `pnpm verify` passed
with 38 test files and 130 tests. Playwright: 60 passed, including `/rooms`,
`/admin/rooms`, and `/admin/settings` auth gates. Browser: desktop and ~390px
in FR, DE, and EN.

**Not included:** Therapist-created reservations, My bookings, monthly billing,
discounts, private notes, and public room signup.

---

## CP-05 — Reserve a room and My Bookings

**Status:** `COMPLETE`

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

**Completion evidence:** Implementation and verification on 2026-09-11.
Forward migration `0010_room_booking_snapshots.sql` adds creator, room-name and
immutable rate/discount/duration/amount snapshots. Therapist reserve flow at
`/{locale}/rooms/book` (`/fr/salles/reserver`, `/de/raeume/buchen`) quotes on
the server and inserts `CONFIRMED` rows inside a room-row lock; the existing
`room_bookings_no_overlap` exclusion constraint remains the last line of
defence. My Bookings at `/{locale}/rooms/bookings` splits upcoming/history.
Available calendar bars open the book page; own bars open management-safe
details. Discount snapshots stay 0 until CP-08. No Stripe objects are created.
`pnpm verify` passed with 49 test files and 183 tests, including quote math,
rule failures, adjacent vs overlap, concurrent same-slot conflict, and privacy.
Browser: signed-in reserve of Cabinet Ouchy 2026-09-14 16:00–17:30 (90 min ×
CHF 35/h = CHF 52.50) visible on the calendar and in upcoming, desktop and
~390px, FR/DE/EN.

**Not included:** Change/cancel UI, admin-created bookings, private notes,
availability requests, payment collection and discount admin.

---

## CP-06 — Changes, cancellations and admin intervention

**Status:** `COMPLETE`

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

**Completion evidence:** See the 2026-09-11 CP-06 completion-log entry.

---

## CP-07 — Private notes and no-availability requests

**Status:** `COMPLETE`

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

**Status:** `COMPLETE`

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

**Status:** `COMPLETE`

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

**Completion evidence:** Recorded in the completion log (CP-09 — 2026-09-11).

---

## CP-10 — Automated charging, reminders and email evidence

**Status:** `COMPLETE`

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
- transactional email for account, booking, request, reminder and billing events
  composed only through `composeTransactionalEmail()`;
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

**Status:** `COMPLETE`

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

### CP-02 — 2026-09-10

- **Result:** Invitation-only admin access management replaces HTTP Basic Auth.
  Admins invite/disable users, grant or revoke `ADMIN` and `ROOM_BOOKING`, and
  open staff booking/waitlist screens through a shared account session. The
  hardcoded course catalogue is persisted in PostgreSQL (20 courses, 14
  sessions) without adding a course CMS.
- **Routes/UI:** `/{locale}/sign-in` (`/fr/connexion`, `/de/anmelden`),
  `/{locale}/invite/[token]`, `/{locale}/admin/users`,
  `/{locale}/admin/users/[id]`, `/{locale}/rooms`, `/{locale}/access-denied`,
  `/{locale}/staff/bookings`; CSV `/api/staff/bookings.csv` and
  `/api/staff/waitlist.csv` require an enabled admin session. Header shows
  Admin for admins, Rooms for `ROOM_BOOKING`, Sign in / Sign out.
- **Migrations:** `0004_accounts.sql`, `0005_course_catalogue.sql`,
  `0006_course_catalogue_data.sql`. Hosted migrate also seeds the catalogue.
- **Automated evidence:** `pnpm verify` passed; 34 test files and 109 tests
  passed, including a successful Next.js production build. Playwright: 58
  passed, including unauthenticated redirects, FR/DE/EN sign-in, CSV 401, and
  removal of HTTP Basic Auth. Directory search, filters, pagination and
  unique-email coverage added in the same-day follow-up.
- **Browser evidence:** Desktop and ~390px inspected. Admin invite → Mailpit
  (gold eyebrow, table layout) → therapist password setup → Rooms nav without
  Admin; therapist denied `/en/admin/users` and staff bookings; admin can open
  staff bookings and audit history. Sign-in checked in FR/DE/EN. Public
  catalogue still works while an admin is signed in. Phone header keeps
  Courses, Contact and Sign in on one compact row. Admin directory search,
  Manage access, and disable/re-enable verified on desktop and ~390px.
- **Preview/production:** Not deployed in this task.
- **Deviations/follow-ups:** Approved Revision 2: CP-02 completed before
  CP-01. Catalogue persistence without a CMS; public catalogue still reads the
  TypeScript seed.
- **Known next work:** CP-01 secure accounts and My Courses.

### CP-01 — 2026-09-10

- **Result:** Public self-registration, email verification, sign-in/out, password
  recovery, in-session password change, profile (including pending email change),
  and My Courses. Guest course checkout remains available. Historical bookings
  link only after the account email is verified, and only to that verified
  identity.
- **Routes/UI:** `/{locale}/sign-up` (`/fr/creer-un-compte`, `/de/konto-erstellen`),
  `/{locale}/verify-email/[token]`, `/{locale}/forgot-password`,
  `/{locale}/reset-password/[token]`, `/{locale}/verify-email-change/[token]`,
  `/{locale}/account`, `/{locale}/account/courses`. Header shows Account when
  signed in; Sign out lives on account pages so Courses and Contact stay on the
  same compact phone row.
- **Migrations:** `0007_public_accounts.sql` (`verify` / `recovery` /
  `email_change` token purposes, `users.pending_email`, nullable
  `bookings.user_id`, `bookings.email_normalized`).
- **Automated evidence:** `pnpm verify` passed; 36 test files and 122 tests
  passed, including a successful Next.js production build of the new account
  routes. Playwright: 62 passed, including FR/DE/EN sign-in/sign-up/forgot/
  account screens, unauthenticated redirects, guest booking, phone layout, and
  `tests/e2e/account-lifecycle.spec.ts` (sign-up → Mailpit verify → change
  password → sign-in → forgot/reset). Integration tests cover linking before/
  after verify, invite/verified hijack refusal, reset session revocation, token
  expiry/reuse, email-change history, signed-in vs guest booking, Zurich
  upcoming/past split, and rate-limit counters.
- **Browser evidence:** Desktop and ~390px inspected in FR/DE/EN. Sign-up,
  verification email in Mailpit (gold eyebrow, table layout, clickable confirm
  URL) at ~560px and a narrow pane, My Courses empty state, profile with
  in-session password change, and guest checkout while unsigned-in. Phone header
  keeps Courses, Contact and Sign in / Account on one compact row.
- **Preview/production:** Not deployed in this task.
- **Deviations/follow-ups:** In-session password change shipped with CP-01 in
  addition to forgotten-password recovery. Local owner account created in the
  development database only; credentials are not committed.
- **Known next work:** CP-03 personal certificate library.

### CP-01 note — 2026-09-10

- Account email is permanent for now. Profile shows it read-only; the server
  does not accept an email change. `/verify-email-change/[token]` and
  `sendEmailChangeVerification` were removed. Migration `0007_public_accounts.sql`
  still carries unused `pending_email` columns and the `email_change` token
  purpose (forward-only).

### CP-03 — 2026-09-10

- **Result:** Users can open My courses and download their own active
  certificate PDFs. Admins attach, replace or revoke certificates on a user
  record. Revocation keeps history and immediately blocks owner download.
- **Routes/UI:** `/{locale}/account/courses` (`/fr/compte/formations`,
  `/de/konto/ausbildungen`), admin panel on `/{locale}/admin/users/[id]`,
  download `GET /api/certificates/[id]/document`. Header shows Account when
  signed in; Sign out lives on account pages. Course-only default after
  sign-in is `/account` (CP-01); certificates share the My Courses page with
  upcoming/past registrations.
- **Migrations:** `0008_certificates.sql` (renumbered after CP-01's
  `0007_public_accounts.sql`).
- **Automated evidence:** `pnpm verify` passed; 38 test files and 130 tests
  passed, including a successful Next.js 16.3.4 production build. Certificate
  Vitest coverage for owner download, stranger/guessed-id 404, revoke 403,
  replace, missing blob unavailable, PDF magic/size, and non-admin attach
  denial. Playwright: 60 passed, including unauthenticated `/account/courses`
  and certificate download 401.
- **Browser evidence:** Desktop and ~390px inspected in FR, DE, and EN for My
  courses, PDF download, and admin attach. Phone header keeps Courses and
  Contact on the same compact row as Account and the language control.
- **Preview/production:** Not deployed in this task.
- **Deviations/follow-ups:** Approved Revision 3: CP-03 completed before CP-01
  on this branch. After merging main, My Courses also lists CP-01
  registrations.
- **Known next work:** CP-04 rooms, rules and privacy-safe availability.

### CP-04 — 2026-09-10

- **Result:** Admins configure room inventory, CHF hourly rates, opening hours,
  booking rules and temporary blocks. Therapists see a privacy-safe day/week
  calendar. Other people's reservations appear only as Booked.
- **Routes/UI:** `/{locale}/admin/rooms`, `/{locale}/admin/rooms/[id]`,
  `/{locale}/admin/settings`, `/{locale}/rooms` (`/fr/salles`, `/de/raeume`).
  Admin subnav: Users | Rooms | Settings. No reservation control in production
  UI.
- **Migrations:** `0009_rooms.sql` (renumbered after CP-01 and CP-03).
- **Automated evidence:** `pnpm verify` as above (38 files / 130 tests,
  production build). Vitest covers create/price/disable/reorder, course-only
  denial, privacy-safe payloads, closed/disabled/block boundaries, block
  conflict without invalidating the booking, and Zurich DST gap/ambiguous
  rejection. Playwright: 60 passed, including unauthenticated `/rooms`,
  `/admin/rooms`, and `/admin/settings`.
- **Browser evidence:** Desktop and ~390px inspected in FR, DE, and EN for
  therapist day/week calendars (Booked vs My booking vs Available), admin rooms
  list/detail, and opening-hours settings. Course-only users are denied `/rooms`.
- **Preview/production:** Not deployed in this task.
- **Deviations/follow-ups:** Approved Revision 3: CP-04 completed before CP-01
  on this branch. Occupancy for privacy tests uses fixture/admin-created
  confirmed bookings, not a therapist booking UI.
- **Known next work:** CP-05 reserve a room and My Bookings.

### Merge note — 2026-09-10

- Merged `main` (CP-01 public accounts, My Courses registrations, 10 CHF Stripe
  test course, buyer-confirmation retry) into this CP-03/CP-04 branch.
- My Courses now lists upcoming/past registrations and the certificate library.
- Migrations on this branch: `0007_public_accounts.sql`,
  `0008_certificates.sql`, `0009_rooms.sql`.
- **Automated evidence:** `pnpm verify` passed; 42 test files and 151 tests,
  including a successful Next.js 16.3.4 production build. Playwright: 62 passed,
  including `tests/e2e/account-lifecycle.spec.ts` (empty registrations plus
  Certificates heading) and guest booking/phone layout.
- **Known next work:** CP-05 reserve a room and My Bookings.

### UI refinement note — 2026-09-10

- No scope change. CP-03 and CP-04 surfaces were reviewed against
  `docs/DESIGN.md` and refined; acceptance criteria are unchanged.
- Status styling is monochrome everywhere (`src/shared/ui/status-label.tsx`);
  the certificate, registration and room-inventory cards no longer use gold as
  a semantic state colour.
- Certificate issue dates are localized through
  `src/shared/format/calendar-date.ts` instead of printing the raw ISO day.
- The therapist availability calendar moved to
  `src/features/rooms/components/availability/` and now merges consecutive
  same-state slots into one continuous bar, shows the visible Zurich date
  range, and adds a Today jump next to the Day/Week control. Week columns are
  days for one room; day columns are rooms, with an explicit "All rooms" chip.
- Room admin forms were split into `src/features/rooms/components/admin/`;
  opening hours are a stacked bordered list that dims and disables the time
  selects on a closed weekday, and reordering is one grouped secondary control.
- **Automated evidence:** `pnpm verify` passed; 44 test files and 163 tests,
  including a successful production build.
- **Manual evidence:** Signed-in walkthrough of `/rooms` (week, day, room
  filter, Today) at desktop and 390px in FR/DE/EN, plus admin rooms, room
  settings and `/account/courses`, with no browser console errors.
- **Pre-existing failure, not caused by this work:** six Playwright course-card
  and five booking assertions hard-code the three 2026 course sessions. The
  10–20 September 2026 session stopped being upcoming once the Zurich date
  rolled to 11 September 2026, so they now expect three dates and see two. The
  same failures reproduce with the pre-refinement course files.

### Edge-case hardening — 2026-09-10

- No scope change. Concurrent-use and bad-input holes found in review were
  closed; acceptance criteria are unchanged.
- Week availability now generates slots for the displayed room only, while the
  room list still includes the full inventory. Occupancy is indexed per request
  instead of scanning every booking/block for every slot.
- Block creation locks the room row, rejects overlapping bookings and
  overlapping blocks in one transaction, and takes Zurich date + time fields
  rather than the browser's `datetime-local` timezone.
- Room create and reorder serialize on `SELECT … FOR UPDATE` so two admins
  cannot mint the same `displayOrder`.
- Certificate attach rolls back the row if audit fails after insert. Replace
  and revoke update only `ACTIVE` rows, so a concurrent revoke cannot swap a
  revoked document. A failed replace no longer deletes the newly committed PDF.
- Opening-hours selects stay submitted when a day is closed, snap to the
  chosen booking interval, and remount after a successful save.
- Calendar hrefs omit `room` unless a UUID is selected, so links no longer
  serialize `room=undefined`.
- **Automated evidence:** `pnpm verify` passed; 45 test files and 168 tests,
  including week-slot scoping, overlapping-block rejection, replace-after-revoke,
  and availability query serialization.

### CP-05 — 2026-09-11

- **Result:** An enabled therapist can reserve an available room and time, see
  the server-calculated CHF amount, confirm an immediately reserved booking, and
  find it on the calendar and in upcoming/history. No payment is taken now.
- **Routes/UI:** `/{locale}/rooms/book` (`/fr/salles/reserver`,
  `/de/raeume/buchen`), `/{locale}/rooms/bookings`,
  `/{locale}/rooms/bookings/[id]`. Therapist subnav: Calendar | My bookings.
- **Migrations:** `0010_room_booking_snapshots.sql`.
- **Automated evidence:** `pnpm verify` passed; 49 test files and 183 tests,
  including quote math, duration/increment/advance/opening/block/disabled
  failures, adjacent vs overlap, concurrent same-slot conflict, ignored
  browser-supplied amounts, and other-therapist Booked-only privacy. Production
  build includes the new routes. Playwright auth guards cover `/rooms/book` and
  `/rooms/bookings`.
- **Browser evidence:** Signed-in reserve of Cabinet Ouchy on 2026-09-14
  16:00–17:30 (90 min × CHF 35/h = CHF 52.50) on desktop and ~390px, in FR, DE
  and EN. Calendar shows My booking; upcoming list and detail show the snapshot
  amount and monthly-billing copy.
- **Preview/production:** Not deployed in this task.
- **Deviations/follow-ups:** Discount snapshots are stored as 0 until CP-08.
  Past starts are unavailable on the calendar as well as rejected at reserve
  time.
- **Known next work:** CP-06 changes, cancellations and admin intervention.

### CP-06 — 2026-09-11

- **Result:** Therapists can change or cancel upcoming room bookings with a
  clear free vs late outcome. Admins can create, move or cancel a booking for a
  room-enabled user and waive a late charge. No booking is deleted.
- **Routes/UI:** `/{locale}/rooms/bookings/[id]/change` and `/cancel`
  (`/fr/salles/reservations/[id]/modifier|annuler`,
  `/de/raeume/buchungen/[id]/aendern|stornieren`); admin `/admin/bookings`,
  `/admin/bookings/new`, `/admin/bookings/[id]`.
- **Migrations:** `0011_room_booking_lifecycle.sql` (billing outcome, cancel and
  waiver columns, append-only `room_booking_events`).
- **Automated evidence:** `pnpm verify` passed; 51 test files and 197 tests,
  including notice-window math, in-place owner move outside the window,
  cancel-and-rebook inside the window, free vs late chargeable amounts, admin
  create/move/cancel/waive, forbidden course-only and other-therapist actors,
  and admin-created/moved mail chrome without the booking UUID. Production build
  includes the new routes. Playwright auth guards cover `/admin/bookings`.
- **Browser evidence:** Therapist in-place change of Cabinet Ouchy 2026-09-14
  16:00–17:30 to 11:00–12:00 (CHF 35.00) with a success notice. Same-day Salon
  Lavaux 15:00–18:00 late-cancelled at CHF 135.00, then admin-waived to CHF 0.
  Admin created and moved Atelier Flon on 2026-09-23 for Camille Rochat; Mailpit
  delivered FR created/moved mail with room, Zurich time and amount and without
  the booking UUID. Desktop and ~390px in FR, DE and EN. No browser console
  errors.
- **Preview/production:** Not deployed in this task.
- **Deviations/follow-ups:** Therapist self-cancel/self-move mail stays in
  CP-10. Discount snapshots remain 0 until CP-08.
- **Known next work:** CP-07 private notes and no-availability requests.

### CP-07 — 2026-09-11

- **Result:** Therapists can keep an owner-only encrypted reminder on a booking
  and request an unavailable interval without reserving it. Admins can
  resolve or decline requests and never see private notes.
- **Routes/UI:** Therapist `/rooms/requests`, `/rooms/requests/new`,
  `/rooms/requests/[id]` (`/fr/salles/demandes`, `/de/raeume/anfragen`);
  booking detail private-note form; calendar unavailable cells and book form
  optional note. Admin `/admin/requests` and `/admin/requests/[id]`.
- **Migrations:** `0012_room_notes_and_requests.sql` (encrypted
  `room_booking_private_notes`, `room_availability_requests` with OPEN unique
  slot index, range/resolution checks).
- **Automated evidence:** `pnpm verify` passed; 61 test files and 259 tests,
  including AES-256-GCM key missing/invalid/rotation, owner-only note CRUD,
  fail-closed reserve when the key is missing, note move on late replace,
  calendar/admin/billing/export/log exclusion, request reject when a room is
  still bookable, concurrent OPEN dedup, admin RESOLVED/DECLINED without
  leaking `adminNote`, and Playwright auth guards for EN/FR/DE request
  routes. Production build includes the new request routes.
- **Browser evidence:** Therapist signed in, booked Cabinet Ouchy
  2026-09-14 10:00–11:00 with note “Bring extra chair”, saw the note only on
  the booking detail (not My Bookings list). Submitted a Sunday 07:00–08:00
  any-room request; notice confirmed the slot stayed unreserved. FR/DE
  request list copy and compact rooms nav checked, including ~390px DE.
  Therapist hitting `/admin/requests` received Access denied. Admin inbox
  showed the request and owner, declined it, and the admin booking list and
  detail for the same booking contained no private-note field or plaintext.
- **Preview/production:** Not deployed in this task.
- **Deviations/follow-ups:** Request create/resolve emails stay in CP-10.
  Withdrawing an OPEN request deletes the row (no `WITHDRAWN` status).
  Requests may target closed or beyond-horizon intervals by design. Hosted
  deploys must set `ROOM_NOTE_ENCRYPTION_KEY`. A Next.js hydration overlay
  appeared on shared chrome during calendar QA; it is not specific to the
  note/request forms.
- **Known next work:** CP-08 discounts and current-month usage.

### CP-08 — 2026-09-11

- **Result:** Admins set one percentage room discount per user. New bookings
  snapshot that discount after the room rate. Therapists and admins see
  open-month billed minutes and amounts, explicitly labelled as not finalized.
  Later price or discount changes do not rewrite existing snapshots.
- **Routes/UI:** Therapist `/{locale}/billing` (`/fr/facturation`,
  `/de/abrechnung`) with Rooms nav Usage; admin `/admin/billing`,
  `/admin/billing/[userId]`, user-detail discount form; CSV
  `GET /api/admin/billing.csv`.
- **Migrations:** `0013_room_discounts.sql` (`users.room_discount_percent`
  0–99).
- **Automated evidence:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (63 files,
  266 tests) and `pnpm build` passed. Coverage includes half-up integer minor
  unit rounding, discount audit, snapshot immutability after later price and
  discount changes, free/late/waiver projection, Zurich month bounds including
  DST, therapist isolation, CSV without private notes, and Playwright auth
  guards plus `tests/e2e/billing.spec.ts` (therapist EN/FR usage at 390px,
  admin discount save and billing list).
- **Browser evidence:** Playwright signed-in therapist `/en/billing` and
  `/fr/facturation` at 390px with open-month labelling and no overflow; admin
  set a 10% discount on a therapist and opened current-month totals.
- **Preview/production:** Not deployed in this task.
- **Deviations/follow-ups:** Discount cap is 99% because a 100% rate would
  make the effective hourly rate zero and fail quote validation. Usage lives
  in `src/features/rooms` rather than a separate `room-billing` package.
  Rounding: `effectiveHourlyRateMinor = round(base * (100 - discount) / 100)`,
  then `amountMinor = round(effective * minutes / 60)`, all integer centimes.
- **Known next work:** CP-10 automated charging, reminders and email evidence.

### CP-09 — 2026-09-11

- **Result:** Therapists save a payment method (fake locally, Stripe Checkout
  `mode: "setup"` when `PAYMENT_PROVIDER=stripe`) and see only brand, last four
  digits and expiry. Admins preview and finalize a closed Zurich month
  idempotently. Booking-derived lines and totals freeze; later price or discount
  changes do not rewrite them. Corrections are extra reasoned adjustment lines.
  Zero-total months can be finalized without a card. The open month cannot.
- **Routes/UI:** Therapist `/billing` now includes payment method and statement
  history; `/billing/setup` (fake card), `/billing/payment-method/return`,
  `/billing/statements/[id]` (`/fr/facturation/releves/[id]`,
  `/de/abrechnung/auszuege/[id]`). Admin month picker on `/admin/billing`,
  per-user finalize/adjust on `/admin/billing/[userId]` and
  `/admin/billing/[userId]/statements/[id]`; CSV
  `GET /api/admin/statements.csv`. User detail links to billing.
- **Migrations:** `0014_room_statements.sql` (`users` Stripe customer and
  display-only payment-method columns; `room_statements` OPEN→FINALIZED plus
  later payment statuses; `room_statement_line_items` USAGE,
  LATE_CANCELLATION, ADJUSTMENT).
- **Automated evidence:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (66 files,
  274 tests) and `pnpm build` passed. Coverage includes idempotent finalize,
  immutable booking lines after a later price change, adjustment totals,
  closed-month-only finalize, zero-total statements, private-note exclusion,
  fake card display metadata, setup-event filtering that ignores course
  Checkout, and Playwright `tests/e2e/billing.spec.ts` plus auth guards
  (therapist fake card EN/FR 390px, admin search, open-month finalize disabled,
  closed August finalize enabled).
- **Browser evidence:** Therapist EN/FR/DE at 390px and desktop: current-month
  usage, Visa •••• 4242, statements empty state, no overflow, no
  MISSING_MESSAGE. Admin month grid with inverted selected month, closed August
  query `?month=2026-08`, CSV links.
- **Preview/production:** Not deployed in this task. Live Stripe setup still
  needs test-mode keys; local/E2E use `PAYMENT_PROVIDER=fake`.
- **Deviations/follow-ups:** EMAIL.md remains binding: CP-10 must compose room
  mail through `composeTransactionalEmail()`, not a second React Email
  template. Charging, webhooks-as-paid-authority and reminders stay in CP-10.
  Payment statuses exist on the statement enum so CP-10 can advance them
  without another migration.
- **Known next work:** CP-10 automated charging, reminders and email evidence.

### CP-03 to CP-06 UI polish pass — 2026-09-11

Not a checkpoint. A consistency review of everything CP-03 through CP-06 added,
against `docs/DESIGN.md`.

- **Result:** The booking surfaces share one control geometry, one bordered
  panel, one filter bar, one pagination and one destructive confirmation
  instead of per-page variants. The admin booking detail presents one decision
  at a time through `?action=`, so it no longer stacks competing primary
  actions.
- **Defects fixed:** `buttonStyles()` set `border-transparent` on its shared
  base, which overrode every variant border colour because equal-specificity
  utilities resolve by stylesheet order; all 23 secondary actions rendered as
  bare text and blended into the page. Secondary now also carries the
  neutral-grey resting surface DESIGN.md requires. The change screen rendered
  its room/date navigator inside the confirm form, so choosing a closed day
  removed the controls needed to leave it. The slot form kept its first
  preview's start in component state, so a later navigation could submit a
  start the new day no longer offered. The admin status filter was labelled
  with `Rooms.statusConfirmed`. Admin list, admin history and cross-midnight
  ranges printed raw ISO instants. Tamper-probe hidden inputs from CP-05 were
  still present in six production forms.
- **Automated evidence:** `pnpm verify` passed; 55 test files and 220 tests.
  New units cover `src/features/rooms/format.ts`,
  `src/features/rooms/slot-selection.ts`,
  `src/features/rooms/admin-booking-action.ts` and the button variant
  contract. `tests/e2e/polish-review.spec.ts` covers the six German phone
  screens, the bordered 44px secondary action, the no-dead-end navigator, the
  cancel confirmation and all three locales at 390px and 1280px; it reads its
  booking ids from the UI and skips without `E2E_ROOM_EMAIL` and
  `E2E_ROOM_PASSWORD`.
- **Browser evidence:** FR, DE and EN at 390px and desktop with no horizontal
  overflow, no raw ISO instants, no missing message keys and no browser or
  server console errors.
- **Deviations/follow-ups:** The public language control stays behind
  `LANGUAGE_SWITCHER_ENABLED`, so locale equivalence is verified by route.
  Native `<input type="date">` still renders in the browser's locale, not the
  page's; replacing it needs a custom picker and is out of scope.

### CP-10 — 2026-09-11

- **Result:** Closed Zurich months can be finalized and charged once from the
  stored statement total. Signed Stripe webhooks (and the fake adapter) are the
  payment authority; browser returns never mark a statement paid. Failed charges
  stay retryable without disabling access. Booking/request/billing mail is
  composed through `composeTransactionalEmail()`, captured in Mailpit, skipped
  on Vercel preview, and recorded as PostgreSQL notification evidence.
- **Routes/UI:** Therapist `/billing` and `/billing/statements/[id]` (FR
  `/facturation`, DE `/abrechnung`); admin `/admin/billing/.../statements/[id]`,
  `/admin/notifications`; cron `GET/POST /api/cron/rooms`; webhook
  `/api/stripe/webhook`. Charge now / Retry / Resume reuse the same stored
  total. PAID statements show no charge action.
- **Migrations:** `0015_room_charges_and_notifications.sql`.
- **Automated evidence:** `pnpm verify` passed: lint 0 errors / 12 unused-arg
  warnings (existing `useActionState` pattern), typecheck, Vitest 72 files /
  289 tests (charging concurrency, missing card, adapter-throw recovery,
  reminder idempotency, unsigned webhook 400, preview `sendMail` block),
  production build. Playwright `tests/e2e/auth-guards.spec.ts` +
  `tests/e2e/billing.spec.ts` (6 passed, including cron 401 and SENT
  notification evidence).
- **Browser evidence:** Therapist EN desktop billing + PAID August 2026
  statement; FR/DE ~390px usage pages with Courses+Contact on the same header
  row; admin notification evidence SENT; Mailpit “Room statement paid —
  August 2026” gold eyebrow, table layout, no statement UUID, no private notes.
- **Preview/production:** Not deployed in this task. Live Stripe charging still
  needs production keys; local/E2E use `PAYMENT_PROVIDER=fake`.
- **Deviations/follow-ups:** Plan “Included” previously named React Email;
  EMAIL.md remains binding and the implementation uses
  `composeTransactionalEmail()` only. Reminder timing is the first hourly cron
  tick inside the configured notice window, not an exact T−24h scheduler.
- **Known next work:** CP-11 production launch and operational handoff.

### CP-11 — 2026-09-12

- **Result:** Dual-origin routing (`mhp-coaching.ch` marketing vs
  `app.mhp-coaching.ch` app), capability-aware absolute nav, app-origin
  noindex, skip-to-content, hourly cron heartbeats with optional ops-alert
  mail, and launch/ops/admin/privacy/security/accessibility handoff docs.
- **Routes/UI:** Same public and app routes; host 308 redirects when
  `APP_ORIGIN` is set. Admin Settings shows Job heartbeats. Header Courses and
  Contact stay on the compact row at ~390px.
- **Migrations:** `0016_ops_heartbeats.sql`.
- **Automated evidence:** `pnpm verify` passed: lint 0 errors, typecheck,
  Vitest 74 files / 297 tests (including origin classification and ops alert
  chrome), production build. Playwright auth-guards + billing 6 passed.
- **Browser evidence:** EN home desktop; admin Settings heartbeats SUCCEEDED
  for `rooms`; 390px admin header keeps Courses+Contact on the same row; FR/DE
  home without MISSING_MESSAGE.
- **Preview/production:** Not deployed in this task. Production DNS, live
  Stripe first charge and Neon restore rehearsal are operator steps in
  `docs/LAUNCH.md` / `docs/OPERATIONS.md`.
- **Deviations/follow-ups:** Live Neon PITR restore was not executed (no
  production Neon in this environment). Live Stripe keys are forbidden outside
  `VERCEL_ENV=production` and were not used. Attach `app.mhp-coaching.ch` only
  after those rehearsals.
- **Known next work:** Post-launch backlog only (credits, recurring bookings,
  calendar sync — not checkpoints).

### Catalogue presentation note — 2026-09-12

- No checkpoint change. Owner-requested catalogue work on top of a complete
  CP-00 through CP-11; the course MVP baseline is unchanged.
- **Student-journey order:** `src/features/courses/catalogue-order.ts` holds the
  canonical default (foundation, then Troubles anxieux and Techniques avancées,
  then the remaining advanced, medical and workshop modules, with bundled
  programmes last). Admins override it in the catalogue order panel on
  `/admin/courses`; overrides persist in `courses.display_order` and are
  audited as `COURSE_REORDERED`.
- **Course format:** courses now carry `module` or `programme`
  (`courses.format`), and a programme declares its contents in
  `course_programme_modules`. Maître Praticien is the first programme. It
  leaves the advanced grid and closes `/courses` in its own section as an
  alternative to booking modules individually; its page lists the included
  modules and each module page links back to it. Admins set the format and
  pick the modules on the course form; the selection is re-validated
  server-side against the catalogue, so unknown ids, nested programmes and
  self-references cannot be stored.
- **Migrations:** `0018_catalogue_display_order.sql` (was authored but missing
  from `drizzle/meta/_journal.json`, so it had never been applied) and
  `0019_course_programmes.sql`. Both are now journalled and applied locally.
- **Automated evidence:** `pnpm verify` passed (lint 0 errors, typecheck,
  Vitest 82 files, production build). New unit tests cover programme
  resolution, bundle pricing, admin selection normalization and the
  persistence round-trip.
- **Browser evidence:** `/courses` in FR, DE and EN at 1280px plus FR at 390px;
  programme and module detail pages in FR; admin course list, catalogue order
  panel and the programme form at 1280px and 390px. No browser console errors.
- **Deviations/follow-ups:** The separate-modules comparison and saving render
  only when the programme is cheaper than its modules; with today's prices
  Maître Praticien is not, so both lines stay hidden. Category chip filters on
  the search toolbar remain unimplemented.

## Plan revision log

### Revision 3 — 2026-09-10

- Approved completing CP-03 and CP-04 before CP-01 at an explicit product
  request.
- Certificate library and privacy-safe room availability now exist.
- CP-01 subsequently landed on main (public self-registration, profile, My
  Courses registrations and historical booking reconciliation) and is merged
  here.
- Account email is permanent for now. Users cannot change it on the profile
  page. CP-01 acceptance criterion 6 was updated to match.
- CP-05 (reserve a room) stays after CP-04 and is now complete.

### Revision 2 — 2026-09-10

- Approved doing CP-02 before CP-01 so staff can operate CP-00 go-live without
  HTTP Basic Auth.
- CP-02 now includes the invitation-only account, session, bootstrap-admin and
  audit foundation that CP-01 listed as a prerequisite.
- CP-01 remains public self-registration, profile, My Courses and historical
  booking reconciliation.
- CP-02 also persists the hardcoded course catalogue into PostgreSQL without
  adding a course CMS.

### Revision 1 — 2026-09-09

- Replaced the coarse room delivery list with user-usable checkpoints CP-00–CP-11.
- Established mandatory status transitions, completion evidence and the meaning
  of “implement through checkpoint X.”
- Kept course certificates as a minimal owned-document library; automatic diploma
  generation and eligibility remain post-launch.
