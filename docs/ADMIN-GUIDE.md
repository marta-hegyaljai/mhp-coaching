# Admin operating guide

Account-session admin only. HTTP Basic Auth is not used. Open
`/{locale}/admin/users` after signing in with an enabled administrator.

Gold appears only on primary CTA hover and selected uppercase eyebrows. Status
is textual. Amounts use the sans-serif with tabular figures.

## Invitations and access

1. **Users** → invite with email, name, locale, `ADMIN` and/or `ROOM_BOOKING`.
2. The invitee sets a password from the emailed app-origin link.
3. Disable rather than delete. The last enabled admin cannot be demoted.
4. Room access is explicit. Course-only accounts never see Rooms or Billing.

## Rooms, hours and blocks

1. **Rooms** → create, price (CHF / hour), reorder, disable.
2. **Settings** → opening hours, interval, min/max duration, advance window,
   cancellation notice, reminder hours.
3. On a room, add blocks for holidays or private use. Blocks are not bookings.

## Bookings and waivers

1. **Bookings** lists reservations in a dense table on wide screens (cards
   remain available). Cancelled bookings are hidden until **Show cancelled** is
   checked. Day view is a Zurich agenda for one date; **Today** jumps to the
   current day. Status uses a thin green or red rail plus the written label,
   not a filled colour block.
2. Admin create/move/cancel from that screen (`?action=`). A late cancel shows
   the retained charge; a waiver zeroes it and is audited.
3. Private notes are owner-only. They are not in this UI, CSV, email or the
   calendar. Do not paste clinical content into admin notes.

## Messages

1. **Calls → Messages**, or a message row on the control panel, opens the
   inbound course question or contact-form record.
2. **Reply by email** sends the visitor a transactional message through the
   same Resend path as other mail. The greeting follows their language; your
   typed text is unchanged. Replies stay on the record.
3. Unanswered rows stay gold. After a send they read as Replied.

## Availability requests

1. **Requests** → open, resolve (optionally by creating a booking) or decline.
2. The therapist message may contain operational detail; it is not a medical
   record. Do not forward it outside the school.

## Billing and statements

1. **Billing** → current Zurich month usage. Search does not list every
   room-enabled user by default.
2. Closed months can be finalized. Booking-derived lines then freeze.
3. Adjustments are extra reasoned CHF lines on `FINALIZED` statements only.
4. **Charge now** / **Retry** / **Resume** always use the stored total. The
   browser never marks paid. Failed payments do not disable access.
5. CSV: current usage, month, or one statement. No private notes.

## Notification evidence

**Billing** → Notification evidence, or `/admin/notifications`, or the
statement page. Statuses: Pending, Sent, Failed, Skipped (preview). Retry of
`FAILED` is safe; `SENT` is not sent twice.

## Job heartbeats

**Settings** → Job heartbeats. Hourly cron. A Failed row plus `OPS_ALERT_EMAIL`
means inspect Vercel logs the same day. See [`OPERATIONS.md`](./OPERATIONS.md).
