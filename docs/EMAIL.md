# Email — Binding layout and copy

This document is the source of truth for every transactional email. It
overrides generic mail-design preferences. Read it before adding or restyling
any notification.

The public site look in `docs/DESIGN.md` still applies: **black and white with
subtle gold, minimalist, mildly brutalist, and classy**. Email is a constrained
medium, so the implementation is a table layout with inline styles — not
Tailwind, flex, or React.

## Mandatory implementation

- Compose HTML only through `composeTransactionalEmail()` in
  `src/features/email/layout.ts`.
- Deliver through `sendMail()` in `src/features/email/transport.ts`.
- Keep a plain-text `text` body beside the HTML. Some clients strip markup.
- Escape all untrusted copy with `escapeHtml()`. The compose helpers already
  escape chrome, details, greetings, intros, quotes and closings.
- Localize FR/DE/EN. Shared field labels live in `Email.fields`. Per-message
  copy stays under `Email.<template>` in `messages/{fr,de,en}.json`.
- Do not add a second mail provider. Local: SMTP to Mailpit. Hosted: Resend
  when `RESEND_API_KEY` is set, or when the Vercel Resend marketplace resource
  injects a prefixed alias such as `EMAILS_RESEND_RESEND_API_KEY`. The from
  address is `RESEND_FROM`, else a mailbox built from `RESEND_EMAIL_DOMAIN` or
  `*_RESEND_EMAIL_DOMAIN`. When both API-key names exist, use the connected
  `EMAILS_RESEND_RESEND_API_KEY` before the portable fallback.

Do **not**:

- invent a page-specific HTML template
- use `<div>` layouts, flex, grid, or `<style>` blocks as the primary layout
- introduce beige, cream, bronze, brown, shadows, gradients, or extra colours
- use gold except on the small uppercase eyebrow
- put pills, rounded cards, or decorative images in mail
- send the internal booking UUID to the buyer; staff mail may keep it
- call real recipients from local or preview environments. `sendMail()` throws
  on `VERCEL_ENV=preview`.

## Anatomy

Every HTML message is the same chrome:

1. Hidden preheader (inbox preview; usually the intro sentence).
2. Black header: gold uppercase eyebrow, then a Georgia/Times serif title
   (course name when there is one).
3. White body: optional serif greeting, muted sans intro, bordered details
   table, optional quoted message, optional closing.
4. Black footer: `MHP Coaching`, `contact@mhp-coaching.ch`, phone.

Details rows are label-above-value, 1px black outer border, hairline row
dividers. Labels are small uppercase grey; values are sans-serif ink. Amounts
stay in the sans-serif, never the serif.

## Tokens (inline only)

Use these hex values from `src/features/email/layout.ts`. Do not pick new ones.

| Role | Value |
| --- | --- |
| Ink / borders / header / footer | `#090909` |
| Paper / body | `#ffffff` |
| Outer shell | `#f3f3f1` |
| Body copy | `#383838` |
| Detail labels | `#5c5c5c` |
| Gold eyebrow | `#c8aa6a` |
| Row hairline | `#d5d5d1` |
| Sans | `Arial, Helvetica, sans-serif` |
| Serif | `Georgia, 'Times New Roman', Times, serif` |
| Width | `560px` inner table, `100%` with `max-width` |

No border-radius. Outlook strips it; the site’s 2px corners are not worth a
forked Outlook template.

## Existing notifications

Add new mail as a function in `src/features/email/` that calls
`composeTransactionalEmail`. Current senders:

| Event | Function | To |
| --- | --- | --- |
| Paid booking | `sendBookingConfirmation` | buyer |
| Paid / failed purchase | `sendPurchaseNotification` | `contact@mhp-coaching.ch` |
| Other payment method (lead) | `sendLeadNotification` | staff |
| Contact / payment inquiry | `sendInquiryNotification` | staff |
| Waiting list | `sendWaitlistNotification` | staff |
| Course advice call reserved | `sendCourseCallConfirmation` | visitor |
| Course advice call reserved | `sendCourseCallStaffNotification` | `contact@mhp-coaching.ch` |
| Course written question | `sendCourseInquiryConfirmation` | visitor |
| Course written question | `sendCourseInquiryStaffNotification` | `contact@mhp-coaching.ch` |
| Account invitation | `sendAccountInvitation` | invited user |
| Admin-created room booking | `sendAdminCreatedRoomBooking` | booking owner |
| Admin-moved room booking | `sendAdminMovedRoomBooking` | booking owner |
| Therapist booking confirmed / changed / cancelled / reminder | `sendRoomBookingConfirmed` and siblings | booking owner |
| Availability request created | `sendAvailabilityRequestCreated` | requester |
| Availability request staff alert | `sendAvailabilityRequestCreatedStaff` | `contact@mhp-coaching.ch` |
| Request resolved / declined | `sendAvailabilityRequestDecision` | requester |
| Statement finalized / payment succeeded / payment failed | `sendStatementFinalizedMail` and siblings | statement owner |
| Scheduled job failure | `sendOpsAlert` | `OPS_ALERT_EMAIL` |
| Sign-up verification | `sendEmailVerification` | registering user |
| Password reset | `sendPasswordRecovery` | account email |

Buyer confirmation shows the course venue
(`organization.courseVenueAddress`: Chem. de la Fenetta 42, 1752
Villars-sur-Glâne), not the booking id.

Paid-course mail is sent when the booking becomes `PAID`: one message to the
buyer, one to `contact@mhp-coaching.ch`. If the buyer send fails, the Stripe
webhook returns 5xx so Stripe retries, later paid events retry the buyer copy
without a second staff mail, and the success page also retries until
`confirmationEmailSentAt` is set. Hosted delivery still requires a verified
Resend domain; otherwise Resend can accept mail to `contact@mhp-coaching.ch`
while rejecting the buyer address.

## New email checklist

1. Read this file.
2. Reuse `composeTransactionalEmail` — pass `eyebrow`, `title`, `intro`,
   `details`, and optional `greeting` / `message` / `closing`.
3. Use `Email.fields` for detail labels.
4. Add FR/DE/EN keys; keep catalogues in sync.
5. Always set `text` as well as `html`.
6. Cover the destination and the shared chrome (`role="presentation"`,
   `#c8aa6a`, `#090909`, brand footer) in unit tests.
7. Inspect the HTML in Mailpit (`http://localhost:8025`) at ~560px and a
   narrow pane. Do not skip the text part.
8. Run `pnpm verify`.
