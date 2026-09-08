# MHP Hypnose — MVP Product Specification

## Objective
Launch a reliable multilingual course website and booking flow quickly.

A visitor must be able to:
1. discover courses,
2. choose a course/date,
3. enter their details,
4. pay via TWINT or Visa/Mastercard,
5. receive confirmation.

Staff must have a reliable record of who booked what and whether payment succeeded.

## Languages
Launch in French, German and English using explicit SEO routes:
- `/fr/...`
- `/de/...`
- `/en/...`

For MVP, `/` may redirect to `/fr`.

A language switcher must preserve the equivalent page where possible.

## Public pages
Minimum:
- Home
- Course/training overview
- Individual course detail
- Booking step/form
- Payment success
- Payment cancelled/failed
- Privacy/legal pages
- Contact/footer information

Do not delay launch for secondary content.

## Course data
For MVP, courses and dates live in source-controlled typed TypeScript config.

Suggested shape:
```ts
type Course = {
  id: string;
  slug: { fr: string; de: string; en: string };
  title: { fr: string; de: string; en: string };
  shortDescription: { fr: string; de: string; en: string };
  description: { fr: string; de: string; en: string };
  priceChf: number;
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

## Booking fields
Minimum:
- first name
- last name
- email
- phone if required by the business
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
- status: `PENDING | PAID | FAILED | REFUNDED | CANCELLED`
- paid timestamp
- confirmation-email timestamp if sent

## Staff view
Later in MVP: small protected booking list with name, email, course/date, amount, status and timestamps. CSV export/filtering only if cheap.

Do not build a broad admin product.

## Email
Required: successful booking/payment confirmation.
Local development must route mail to Mailpit, never real recipients by default.

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
- vouchers/waitlists

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
