# Swiss privacy and retention review — CP-11

Review of the implemented platform against the public privacy copy in
`src/features/legal/privacy.ts` and [`ROOM-BOOKING.md`](./ROOM-BOOKING.md).
This is an engineering review, not legal advice. Counsel should read it before
the first live therapist cohort.

## Roles and data

| Data | Purpose | Visible to |
| --- | --- | --- |
| Account email, name, locale | Authentication and mail | Self, admin |
| Course bookings (guest or account) | Teaching enrolment | Self (after verified email match), staff |
| Room bookings, snapshots, statements | Scheduling and invoicing | Owner, admin (no private notes) |
| Encrypted private booking notes | Owner memory aid | Owner only |
| Availability-request messages | Operational scheduling | Requester, admin |
| Contact and course-question replies | Operational correspondence | Recipient, admin |
| Payment method display (brand, last4, exp) | Billing | Owner, admin |
| Stripe customer / payment-method ids | Charging | System, Stripe |
| Notification payloads | Delivery evidence | Admin |
| Audit events | Access control | Admin |

No patient management, clinical files or medical records belong in this product.
The private-note UI warns against storing them. Admin cannot decrypt notes.

## Lawful bases (as implemented)

- Contract and pre-contract for course sales and room hire.
- Legitimate interest for abuse prevention (auth rate limits, audit).
- Legal obligation for Swiss business-record retention of invoices/statements.

## Retention

Public copy: bookings, payment events and accounting records are kept as long
as Swiss duties require, generally ten years. Application code does not auto-
delete statements or bookings. Private notes persist with the booking until a
future retention job is explicitly designed; they remain encrypted at rest.

## Cross-border processors

| Processor | Role | Region intent |
| --- | --- | --- |
| Vercel | Hosting | Configure Frankfurt/EU if offered |
| Neon | PostgreSQL | Frankfurt |
| Stripe | Payments | Processor DPA; no PAN in our DB |
| Resend | Transactional mail | DPA; preview cannot send |

## Checks performed in this checkpoint

- Private-note material is asserted out of mail, CSV, notifications and public
  calendar projections (`assertNoPrivateNoteMaterial`).
- App origin is noindex; private routes are robots-disallowed.
- Guest course checkout does not require an account.
- Historical course claims require a verified matching email.

## Residual

- A formal DPA pack and cookie/analytics disclosure for Vercel Analytics should
  be confirmed with counsel.
- There is no self-serve account deletion UI; handle via admin disable + a
  documented export if a data-subject request arrives.
