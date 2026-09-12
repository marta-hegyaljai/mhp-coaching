# Launch checklist — CP-11

Production cutover for the MHP platform. Product behaviour stays in
[`ROOM-BOOKING.md`](./ROOM-BOOKING.md) and [`MVP.md`](./MVP.md). This file is the
ordered go-live list. Do not connect `app.mhp-coaching.ch` until every gate
below is checked.

## Origins

| Origin | Role |
| --- | --- |
| `https://mhp-coaching.ch` | Public marketing, course catalogue, guest checkout |
| `https://app.mhp-coaching.ch` | Accounts, rooms, billing, admin |

One Next.js app serves both. Set:

```
SITE_URL=https://mhp-coaching.ch
MARKETING_ORIGIN=https://mhp-coaching.ch
APP_ORIGIN=https://app.mhp-coaching.ch
SESSION_COOKIE_DOMAIN=.mhp-coaching.ch
```

`www.mhp-coaching.ch` is treated as marketing. Preview Vercel hosts are not
redirected. Guest course checkout must remain on the marketing origin.

## Environment gates

- [ ] `VERCEL_ENV=production` only on the production project.
- [ ] Stripe **live** keys only in production (`sk_live_` is rejected elsewhere).
- [ ] Stripe webhook endpoint `https://app.mhp-coaching.ch/api/stripe/webhook` (or the marketing origin if that is the only attached domain during a staged cutover) with the live signing secret. Events: Checkout (courses + setup), PaymentIntent for room statements.
- [ ] `PAYMENT_PROVIDER=stripe` in production; `fake` locally and in CI.
- [ ] Resend domain `mhp-coaching.ch` verified; `RESEND_FROM` matches the verified mailbox; `OPS_ALERT_EMAIL` set to a staff mailbox that is allowed to receive job failures.
- [ ] `CRON_SECRET` set; Vercel Cron `GET /api/cron/rooms` hourly.
- [ ] `ROOM_NOTE_ENCRYPTION_KEY` unique to production; previous key only if rotating.
- [ ] Neon Frankfurt, pooled + unpooled URLs, backups enabled.
- [ ] No production secrets in git, previews, or fixtures.

## Functional rehearsal (authorized test records only)

1. Invite a therapist on the app origin. Sign in FR, DE and EN on desktop and ~390px.
2. Open availability, book, change, cancel (inside and outside the notice window).
3. Submit a no-availability request. Admin resolve/decline.
4. Save a live test card, confirm usage, finalize a **closed** Zurich month on a
   dedicated test user, charge once, confirm PAID from the webhook not the browser.
5. Guest course checkout on the marketing origin still pays and emails.
6. Admin: invitations, rooms, blocks, waivers, statements, failed payments,
   notification evidence, job heartbeats under Settings.

## SEO and privacy

- Marketing origin: public pages indexed; private paths noindex + robots disallow.
- App origin `robots.txt` disallows `/`.
- Private notes never appear in email, CSV, calendar, or notification evidence.

## Rollback

See [`OPERATIONS.md`](./OPERATIONS.md). Do not attach the app domain until the
rollback owner and Neon restore point are named.

## Ownership

| Area | Owner |
| --- | --- |
| Domain / Vercel | Platform admin |
| Neon backups | Platform admin |
| Stripe live / webhooks | Billing admin |
| Resend / Mailpit | Platform admin |
| Failed cron / payments | Billing admin (same-day) |
| Content / rooms inventory | School admin |
