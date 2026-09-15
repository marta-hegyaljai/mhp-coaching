# MHP Hypnose — MVP Product Specification

## Scope and status

This document defines the **course-booking MVP baseline**. That baseline is
implemented and must remain reliable while the product expands into the MHP
Platform. It does not define the next room-booking release; see
[`ROOM-BOOKING.md`](./ROOM-BOOKING.md).
Implementation progress and the next deliverable are tracked only in
[`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md).

Implemented today:

- localized public pages and SEO routes for French, German and English;
- source-controlled course catalogue, sessions, calendar and waitlists, with the
  same catalogue persisted in PostgreSQL for go-live durability;
- guest course registration with postal address persisted before payment;
- fake and Stripe Checkout providers, signed webhook processing and email;
- alternative-payment inquiries;
- a free fifteen-minute advice call from each course detail and booking page,
  with admin-managed Zurich hours and collision-safe 15-minute slots, or a
  written question instead;
- admin-authenticated booking and waitlist lists with CSV export; and
- public accounts: sign-up, email verification, password recovery, profile
  (name and language; email is permanent), My Courses and verified-email
  booking reconciliation, while guest checkout remains available.

Not implemented today: certificates, a full course-admin CMS, or any
room-booking feature.

## Original objective

Launch a reliable multilingual course website and booking flow quickly.

A visitor must be able to:
1. discover courses,
2. choose a course/date,
3. enter their details,
4. pay via TWINT or Visa/Mastercard,
5. receive confirmation.

Staff must have a reliable record of who booked what and whether payment succeeded.

## Actors and forward compatibility

The course MVP deliberately permits guest checkout. A visitor does not have to
create an account to register. The registration retains the submitted email as
a durable snapshot.

After a new account verifies its email, existing guest course registrations with
the same normalized email become visible to that user. An account is not required
retroactively and room-booking permission is never inferred from course history.
See [`PRODUCT-VISION.md`](./PRODUCT-VISION.md) and
[`ROOM-BOOKING.md`](./ROOM-BOOKING.md) for the broader model.

## Languages
Launch in French, German and English using explicit SEO routes:
- `/fr/...`
- `/de/...`
- `/en/...`

For MVP, `/` may redirect to `/fr`. The language switcher stays implemented but
can be hidden in public chrome while French remains the default public locale.
DE/EN routes, hreflang and sitemaps remain in place.

A language switcher must preserve the equivalent page where possible.

## Public pages
Minimum:
- Home
- Course/training overview
- Individual course detail
- Booking step/form
- Payment success
- Payment cancelled/failed
- Privacy/legal pages (imprint, terms of use, booking terms, privacy, copyright)
- Contact/footer information
- Case Library and Insights (public nav destinations; first studies and notes forthcoming)
- About / founder (Marta Hegyaljai Python)

Do not delay launch for secondary content.

## Course data
The public catalogue still reads the typed TypeScript seed. The same 21 rows and
their sessions are also stored in PostgreSQL (`courses`, `course_sessions`) with
stable ids matching existing bookings. A later course-admin slice can switch
public reads to the database without renaming ids.

The public catalogue covers the original 20 formations, grouped as foundation, advanced,
medical hypnosis, and practical workshops, plus a temporary internal 10 CHF Stripe
payment-test course. Workshops and the M.I.A. transgenerational
course can be paused in catalogue config without deleting them, so a later admin panel
can republish rows from the same structure. All course delivery locations are
shown as Fribourg. Dates may remain empty until confirmed; an undated course
cannot be purchased. Visitors join a per-course waiting list (name, email,
phone) stored in PostgreSQL so staff can contact them when a session opens.
Confirmed dates are stored on each course and must be chosen explicitly when
more than one session is open.

Suggested shape:
```ts
type Course = {
  id: string;
  slug: { fr: string; de: string; en: string };
  title: { fr: string; de: string; en: string };
  shortDescription: { fr: string; de: string; en: string };
  description: { fr: string; de: string; en: string };
  location: { fr: string; de: string; en: string };
  priceChf: number;
  category: "foundation" | "advanced" | "medical" | "workshop";
  dates: CourseDate[];
};

type CourseDate = {
  id: string;
  startDate: string;
  endDate?: string;
  location: string;
  capacity?: number;
  active: boolean;
};
```

## Booking flow
Course page
→ choose date
→ booking form
→ create `PENDING` booking in PostgreSQL
→ create Stripe Checkout session
→ redirect to Stripe
→ user pays via TWINT/card
→ Stripe webhook confirms payment
→ booking becomes `PAID`
→ confirmation email
→ success page

The Stripe webhook is authoritative. Never mark a booking paid just because the success URL was loaded.

Undated published courses skip checkout. The course page sends visitors to a
waiting-list form (first name, last name, email, phone, privacy acceptance).
Dated courses keep purchase as the primary action and offer the same waiting
list as a quieter secondary option when none of the published dates fit.
A unique `(courseId, email)` row is stored in `waitlist_entries` so staff can
contact people when a date opens.

## Booking fields
Minimum:
- first name
- last name
- email
- phone if required by the business
- postal address
- selected course/date
- locale
- required privacy/terms acceptance

Avoid unnecessary personal data.

## Payments
Provider: Stripe.
Required: TWINT, Visa, Mastercard.
Use CHF for Swiss course checkout unless explicitly changed later.

Implement a small `PaymentProvider` abstraction and a deterministic `FakePaymentProvider` for local/automated tests.

## Persisted booking data
At least:
- booking id + timestamps
- first/last name
- email/phone if collected
- locale
- course id + course-date id
- course/date/location/price snapshot where useful
- amount in minor units + currency
- payment provider/reference
- status: `LEAD | PENDING | PAID | FAILED | REFUNDED | CANCELLED`
- postal address snapshot
- paid timestamp
- confirmation-email timestamp if sent

## Staff view

The implemented MVP now protects the booking and waitlist view with the shared
`ADMIN` role. HTTP Basic Auth has been removed.

Do not build a broad course-admin CMS in this phase.

## Email
Required:
- confirmation to the buyer after a successful payment
- staff copy to `contact@mhp-coaching.ch` on every paid or failed purchase
- staff notification when someone submits the contact form
- staff notification when someone asks for another payment method (lead booking or payment inquiry form)

Application templates go through the existing email adapter (`src/features/email`). Compose HTML only with `composeTransactionalEmail()`; layout and copy rules in `docs/EMAIL.md` are binding. Local development must route mail to Mailpit, never real recipients by default. Hosted delivery uses Resend when `RESEND_API_KEY` is set, or when the Vercel Resend marketplace resource injects a prefixed alias such as `EMAILS_RESEND_RESEND_API_KEY`.

## SEO — launch critical
Public pages must:
- render useful HTML server-side/static
- have localized title/meta description
- canonical URL
- FR/DE/EN hreflang alternates
- sitemap entries
- correct robots behavior
- semantic headings/internal links
- optimized images and strong Core Web Vitals
- appropriate Organization/Course/Event/Breadcrumb structured data when valid

Before replacing the old website, map valuable old URLs to 301 redirects.

## Explicitly out of MVP scope
- student accounts/dashboard
- instructor portal
- packages/entitlements
- attendance/completion/evaluations
- diplomas/qualification progress/exams
- CMS for courses
- CRM
- complex roles
- invoice workflow
- accounting reconciliation
- vouchers and CRM-style waitlist tooling beyond the undated-course list

These exclusions describe the completed course MVP, not a permanent prohibition.
Accounts, student-owned course history/certificates, roles and room booking are
now approved planned work. They must be implemented only in the ordered platform
slices, rather than being folded opportunistically into unrelated MVP fixes.

## MVP success criteria
1. Courses are usable on a modern phone in FR/DE/EN.
2. User can select a course/date and complete Stripe test checkout.
3. Signed Stripe webhook marks the correct booking paid exactly once.
4. Staff can see the booking.
5. Confirmation works.
6. Failed/cancelled checkout never produces `PAID`.
7. Localized SEO metadata is correct.
8. `pnpm verify` passes.
9. App runs locally with Docker PostgreSQL + Mailpit.
10. Deployment to Vercel needs no code changes.
