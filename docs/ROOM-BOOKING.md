# MHP Platform — Room Booking Product Specification

## Status and purpose

This document is the product source of truth for the room-booking module. The
module is the next major expansion of the existing course-booking MVP. CP-04
delivers configurable room inventory, opening hours, temporary blocks and a
privacy-safe therapist availability calendar. Therapist-created reservations
and monthly billing arrive in later checkpoints. Build remaining slices inside
the same application as Courses, without regressing anonymous course booking.

The product becomes the **MHP Platform**:

```text
Shared account, profile, permissions, Stripe identity, email and UI
├── Courses — discovery, registration, payment and student history
└── Rooms — therapist availability, booking and monthly billing
```

Use one Next.js application, one deployment, one Neon PostgreSQL database, one
account system and one Stripe customer identity per person. Keep Courses and
Rooms as separate domains in a modular monolith; do not couple their tables or
business logic merely because they share users and infrastructure.

The public marketing site remains `https://mhp-coaching.ch`. The authenticated
application is intended to live at `https://app.mhp-coaching.ch`, linked from the
marketing site. Exact routing and migration timing are deployment decisions,
not a reason to split the codebase.

## Actors, roles and access

Use these product terms consistently:

| Actor | Account | Courses | Rooms | Administration |
| --- | --- | --- | --- | --- |
| Visitor | No | Browse and book courses | None | None |
| User | Yes | Own registrations, future courses, history and certificates when available | None | None |
| Therapist | Yes | Everything a user can access | Room booking, own requests, notes, payment method and billing | None |
| Admin | Yes | Full course administration when built | Full operational room administration | Users, access and settings |

A therapist is an ordinary MHP user with the explicit `ROOM_BOOKING`
capability. Having an account, taking a course or being described as a therapist
does not grant it automatically. There is no public room-booking registration;
an admin invites a person or enables the capability on an existing account.

`ADMIN` grants application administration and all operational room actions. It
does **not** grant access to a therapist's private booking notes. That privacy
boundary is absolute, including for administrators.

Course booking remains available without an account. Store the registration
against the submitted email. When a person later creates an account and verifies
that email, link existing course registrations to the account using a
case-insensitive normalized email match. Never reveal or claim registrations
for an unverified email. Preserve the booking's email snapshot even after it is
linked, and support an explicit staff-assisted reconciliation path for corrected
or changed addresses.

Prefer application-owned PostgreSQL authentication. Do not introduce Supabase
or another provider-coupled auth system. A person has one login, profile and
Stripe customer across both modules. Store only Stripe identifiers, never card
data. The detailed session/password design must receive a focused security
review before implementation.

## Therapist experience

Authenticated navigation can grow toward:

```text
Home | Courses | Rooms | Billing | Profile
```

Routes remain locale-prefixed, for example `/{locale}/rooms/calendar`,
`/{locale}/rooms/bookings`, `/{locale}/rooms/requests`, `/{locale}/billing` and
`/{locale}/profile`. Authenticated pages are private/noindex.

Only show modules allowed by the current user's server-derived permissions.
Course-only users must not see Rooms or room billing. Hiding navigation is not
authorization; every read and mutation is authorized on the server.

A therapist can:

- see active rooms and day/week availability;
- create an immediately confirmed reservation without paying at booking time;
- modify or cancel an eligible reservation;
- see upcoming reservations and history;
- create, edit and delete a private note on their own reservation;
- request a time when no room is available;
- see current accumulated usage and finalized monthly statements; and
- manage the saved payment method used for monthly billing.

They cannot identify another reservation's owner, read another person's private
note, manage rooms/users/settings or inspect another person's billing.

## Rooms, opening hours and blocks

Each room has at least:

```text
id, name, description, hourlyRateMinor, currency, active, displayOrder,
createdAt, updatedAt
```

Photos, capacity, size, equipment and amenities are optional later metadata.
Prices are per room. Disabling a room indefinitely uses `active`; temporary
unavailability uses separate room-block records with room, start/end, reason,
creator and timestamp.

Admins configure normal opening intervals by weekday. Do not hardcode them.
The initial business example is weekdays 07:00–21:00, Saturday 08:00–18:00 and
Sunday closed, but saved settings are authoritative. Blocks represent holidays,
maintenance and other exceptions.

The business timezone is `Europe/Zurich`. Persist instants in timezone-aware
columns, interpret opening hours as Zurich wall-clock rules, and test daylight
saving transitions explicitly. Reject invalid or ambiguous local times rather
than silently shifting a reservation.

Creating a block that overlaps a confirmed reservation must show the conflicts
and require an explicit resolution; it must never silently cancel or invalidate
bookings.

## Availability calendar

Week view is primary; day view is required. Month view is optional. The calendar
must be usable around a 390px viewport and clearly distinguish:

- available time;
- booked time;
- unavailable/closed time; and
- the current therapist's own reservations.

Availability discovery is time-first. With no room filter, day and week views
aggregate every active room and show how many rooms can support the minimum
booking duration at each start time. Choosing a start automatically carries one
valid room into the confirmation step; a therapist may filter to any subset of
acceptable rooms, and availability counts then include only that subset. When
several considered rooms support the chosen start, the confirmation step lists
each valid room so the therapist chooses the one they prefer. Every valid
interval is its own calendar-sized click target. Phone week
days switch from the already-loaded week without a server round trip, and a date
picker provides direct month/date jumps. Past available intervals remain
bookable so a therapist can record room use they forgot to enter at the time;
opening hours, blocks, collisions, duration and pricing rules still apply.

For another person's reservation, return and render only `Booked`. Do not send
the owner identity, note, billing, or other private fields and then merely hide
them in the browser. A therapist's own event may include the minimum details
needed to manage it.

## Creating and changing reservations

The therapist chooses a room, date, start, end and optional private note. Before
confirmation show a transparent calculation, for example:

```text
Room 2 · 14:00–15:30
90 minutes × CHF 40/hour = CHF 60
```

No payment occurs at booking time. A successful transaction immediately reserves
the room. The server determines the current user, permission, active room,
opening hours, blocks, collision state, room rate, user discount and booking
rules. Never trust browser-supplied identity, role, price, discount or amount.

Configurable rules include:

```text
cancellationNoticeHours = 48
bookingIntervalMinutes = 30
minimumBookingMinutes = 60
maximumBookingMinutes
maximumAdvanceBookingDays
timezone = Europe/Zurich
reminderNoticeHours = 24
```

Users may change room, start and end while eligible. Apply the same availability
checks atomically. Inside the cancellation window, do not let modification evade
the late-cancellation charge; initially treat a material change conservatively
as cancel-and-rebook and surface its billing consequence before confirmation.
Retroactive entry applies to new reservations only: an existing future booking
cannot be moved into the past.

Admins can create a booking for a user and reschedule an existing booking to a
different room/time. Record the acting admin and before/after values, include it
in the user's list and billing, and send the appropriate notification. Normal
availability rules still apply.

## Collision protection

The invariant is:

```text
One room cannot have overlapping active reservations, and a reservation cannot
overlap a room block.
```

Enforce this on the server inside a database transaction and at PostgreSQL level
where possible (for example, exclusion constraints over room and time range for
active rows). UI availability is advisory only. Two concurrent attempts for the
same slot must never both succeed. Apply equivalent transactional protection
when creating blocks, changing bookings and admin rescheduling.

## Cancellation and billing outcome

The initial cancellation deadline is 48 hours and remains configurable.
Therapists can cancel after the deadline so the room becomes available:

- before the deadline: release the room and do not charge;
- inside the deadline: release the room but keep the snapshotted charge;
- admin waiver: release the room and record a zero-charge waiver.

Show the exact amount before a late cancellation is confirmed. Never delete a
cancelled reservation.

Keep reservation lifecycle small (`CONFIRMED`, `CANCELLED`) and model billing
outcome separately: completed use, free cancellation, chargeable late
cancellation or admin waiver. Whether a booking occurred is derived from time,
not another status. Retain audit history.

At creation snapshot:

```text
baseHourlyRateMinor
discountPercent
effectiveHourlyRateMinor
durationMinutes
amountMinor
currency
```

An admin-configured percentage discount initially applies across all rooms.
Changing room prices or discounts must never rewrite historical amounts.

## Private notes

Private notes are sensitive personal reminders and are visible only to their
owner—not other therapists and not admins. Keep them in a separate table such
as `room_booking_private_notes`, keyed by booking and owner, and preferably use
application-level encryption at rest with managed key rotation.

All ordinary calendar, booking, admin, export and billing queries must avoid
selecting the note table entirely. Notes must not enter email, logs, analytics,
error reporting, admin APIs or exports. Admin role never bypasses the explicit
`booking.userId === currentUser.id` rule. Add tests proving this boundary.

The field must warn: “Personal reminder only. Do not store medical records or
detailed clinical information here.” Users can edit or delete their own note.

## No-availability requests

When no room is available for a chosen interval, offer “Request this time slot.”
A request contains the user, requested start/end, optional preferred room,
optional message, status, timestamps and resolution metadata. It does not hold
inventory and is not a reservation.

Statuses are `OPEN`, `RESOLVED`, `DECLINED`. Users see their own requests and
statuses. Admins receive an inbox, may add internal notes and resolve or decline
requests. Do not build automatic rearrangement. The message is admin-visible and
must warn users not to include patient information.

## Current and historical billing

Room use is billed monthly, not at booking time. During an open month, therapists
see accumulated minutes, amount, per-room totals and booking-level detail. Admins
see the same across users and can drill into a user's history and export a month
to CSV.

Create explicit monthly statements with one row per user and month:

```text
OPEN → FINALIZED → PAYMENT_PENDING → PAID
                              └────→ PAYMENT_FAILED
```

A statement records total minutes, final amount, currency, status, timestamps
and Stripe references. When finalized, its line items and total become immutable.
Corrections use explicit auditable adjustment/waiver line items, never silent
recalculation.

At month end, charge the saved Stripe payment method from the finalized statement
amount. Use a SetupIntent or current Stripe equivalent to collect the method.
Stripe webhooks are authoritative and idempotent; a browser return never marks a
statement paid. A failed payment remains visible to user and admin and triggers
an update-payment-method email. Do not automatically disable access after the
first failure; admins initially handle overdue accounts.

## Email and notification evidence

Use the shared email infrastructure: Resend in hosted environments, React Email
templates, and Mailpit locally. Required categories are:

- account invitation and password setup/reset;
- booking confirmation, modification, cancellation, admin creation and admin move;
- configurable booking reminder (initially 24 hours before);
- new request alert and request resolution/decline;
- statement finalized, payment succeeded and payment failed.

Store notification attempts and provider/delivery state in PostgreSQL so staff
can answer whether a message was sent. Design retries to be idempotent. Private
booking notes are prohibited from all notification payloads.

## Admin product

The room admin area grows to:

- **Dashboard:** operational exceptions and failed payments;
- **Rooms:** create/edit, price, disable and temporary blocks;
- **Bookings:** search/filter, create for user, move, cancel and waive;
- **Requests:** open queue, resolution/decline and internal notes;
- **Users:** invite/manage, room access, discounts, billing/payment state;
- **Billing:** current totals, history, statements, failures and CSV;
- **Settings:** opening hours, cancellation, intervals, duration, advance window
  and reminders.

Admin actions must be server-authorized and auditable. Avoid destructive deletion
when a status/history entry preserves the business record.

## Security and audit requirements

- Authorize every query and mutation on the server; the browser never connects
  directly to PostgreSQL.
- Use secure session cookies, CSRF protection where applicable, rate limiting for
  authentication and recovery, strong password hashing, verified emails and
  revocable sessions.
- Derive user, permission, rate, discount and statement amount from trusted data.
- Minimize calendar response fields and maintain separate user/admin projections.
- Record booking creation/change/cancellation, admin creation/rescheduling,
  waivers, blocks, price/discount changes, statement finalization, payment
  attempts and future credit adjustments.
- Never log secrets, payment details, private notes or patient information.
- Test horizontal/vertical authorization, concurrent booking attempts, webhook
  replay, time boundaries and Zurich DST behavior.
- Apply Swiss privacy and retention requirements before production launch.

## Delivery plan

The executable sequence is maintained in
[`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md). Its stable checkpoint IDs,
statuses, user-visible outcomes, exclusions, acceptance criteria and completion
log are authoritative. This specification defines what the room module must do;
it does not independently track implementation progress.

Future tasks should name a target such as “implement CP-05” or “implement through
CP-07.” Checkpoints run in order from the first incomplete ID. Each checkpoint
must preserve the public course flow, ship forward migrations and end as a
releasable user/admin capability—not only infrastructure or placeholder UI.

## Explicitly post-launch

Do not delay the room release for free-hour credits, recurring bookings,
utilization analytics, calendar integrations, automatic rearrangement, advanced
dunning, multiple centers, native apps or patient management.

Future credits are measured in minutes, optionally restricted to a room, support
partial coverage and use an append-only ledger (`GRANT`, `USED`, `RESTORED`,
`ADJUSTMENT`, `EXPIRED`). Future calculation order is room rate → user discount
→ credits → billed amount. Current snapshots and statement line items must leave
room for that addition without implementing it now.

## Acceptance criteria for the room release

The first room release is not complete until:

1. only admins can grant room access and only enabled therapists can enter it;
2. users and visitors retain the documented course experience;
3. another therapist's identity and private data never appear in calendar/API data;
4. concurrent overlapping booking attempts cannot both succeed;
5. opening hours, blocks, intervals and Zurich DST rules are enforced server-side;
6. create/change/cancel/admin operations produce correct billing and audit history;
7. private notes are owner-only and absent from admin, email, logs and exports;
8. current totals and finalized historical statements reconcile to line items;
9. Stripe webhook replay is safe and payment failure remains actionable;
10. reminders and transactional messages have internal delivery evidence;
11. room calendar and booking flows work on mobile and in FR/DE/EN;
12. security tests, relevant E2E tests and `pnpm verify` pass.
