# MHP Platform — Product Vision

## Product direction

MHP is evolving from a reliable public course-booking site into one coherent
platform with two major domains:

```text
MHP Platform
├── Courses — the complete student journey
└── Rooms — private room rental for approved therapists
```

The course MVP is implemented. The next approved expansion is the shared account
foundation and room-booking module described in
[`ROOM-BOOKING.md`](./ROOM-BOOKING.md). Other items in this document are
long-term context, not permission to add them to an unrelated delivery slice.
Executable scope and status live in
[`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md).

## People and access

- **Visitor:** can browse and book courses without an account.
- **User:** can access course registrations, future courses, history and
  certificates as those account features ship.
- **Therapist:** a user explicitly granted `ROOM_BOOKING`; also has all normal
  course-user functionality.
- **Admin:** manages users, capabilities, both domains and platform settings,
  except that private therapist booking notes remain owner-only.
- **Instructor:** a future course-domain role, not required for the first room
  release unless the same person is separately an admin or therapist.

The platform has no public therapist signup. An admin enables room access for a
selected existing user or sends an invitation. A course student's verified
account may later be upgraded without creating a second identity.

Visitors may continue course checkout without an account. When they later verify
an account email, prior registrations are linked safely by normalized email. The
same account carries one profile and one Stripe customer reference across modules.

## Courses vision

The long-term course journey is:

```text
Discovery → registration → payment → attendance → completion → evaluation
→ module diploma → further modules → qualification progress → exams → final diploma
```

One central student record should support:

- account dashboard, upcoming courses and complete training history;
- course/module/package entitlements separate from reserving a date;
- instructor participant, attendance and completion views;
- central admin student records;
- evaluations, reminders and status-driven communications;
- configurable diploma eligibility, templates, archive and verification;
- qualification and theoretical/practical exam progress;
- cancellations, rescheduling, refunds, credits, invoices and manual payments;
- course capacity, marketing alerts, reporting and accounting integrations; and
- a responsible CRM/lead funnel.

These capabilities remain phased. Do not delay the room release to build the
entire student lifecycle.

## Rooms vision

Approved therapists can understand availability quickly, reserve a room with
collision-safe guarantees, manage their bookings and pay one accurate monthly
statement. Admins manage inventory, access, exceptions and billing without
seeing therapists' private notes or exposing one therapist's identity to another.

The initial room release includes rooms and prices, opening hours and blocks,
day/week availability, create/change/cancel, admin booking/rescheduling,
late-cancellation rules, private notes, no-availability requests, discounts,
current and historical billing, immutable monthly statements, saved Stripe
payment methods, monthly charging, notifications and audit history.

Post-launch room options include minute-based free-hour credits with a ledger,
recurring bookings, utilization reporting, calendar integrations, automatic
rearrangement, advanced dunning and multiple centers. Patient management is not
part of the product.

## Architectural implication

Keep one Next.js modular monolith, one PostgreSQL database, one authentication
system, one email infrastructure and one Stripe customer identity per person.
Share identity and infrastructure while keeping `course_*` and `room_*` domain
models separate.

Durable records and snapshots matter: historical course registrations, room
prices/discounts, cancellations, statement line items, payments, notifications
and audit events must remain understandable after configuration changes.

## Product principles

- Preserve guest course registration; accounts add value rather than gate sales.
- Grant room access explicitly and enforce all authorization server-side.
- Favor privacy, mobile usability and straightforward administration.
- Keep sensitive private notes out of admin queries, emails, logs and exports.
- Avoid microservices, provider lock-in, generic-SaaS complexity and premature
  patient/accounting features.
- Ship the smallest coherent vertical slice while keeping the course MVP stable.
