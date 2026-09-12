# Operations — production runbook

Companion to [`LAUNCH.md`](./LAUNCH.md). Keep this beside the Vercel, Neon,
Stripe and Resend dashboards.

## Dual origin

`src/lib/origins.ts` redirects marketing-host app paths to `APP_ORIGIN` and
app-host public paths to `MARKETING_ORIGIN` (308). Previews (`*.vercel.app`)
are unchanged. Session cookies may use `SESSION_COOKIE_DOMAIN=.mhp-coaching.ch`
so a marketing-origin header can show Account/Rooms after sign-in on the app
host.

## Neon migrations

Production and preview Vercel builds run `pnpm db:migrate` before `next build`.
SQL in `drizzle/` is forward-only.

### Backup

1. Neon console → project → Backups. Confirm PITR window (typically 7 days on
   the paid plan; confirm the live plan).
2. Before a risky migration, create a manual backup / snapshot and record the
   timestamp in the release note.
3. Rehearse restore on a **branch** database, not production:
   `neonctl branches create --name restore-rehearsal --parent <prod>`
   or restore a snapshot to a new branch, point a preview `DATABASE_URL` at it,
   run `pnpm db:migrate` (should be no-op) and `pnpm verify` against that URL.

### Rollback

Application rollback: redeploy the previous Vercel production deployment.
Schema rollback is **not** automated. If a migration must be undone:

1. Restore Neon to the snapshot taken before the migration (branch first).
2. Redeploy the git SHA that matches that schema.
3. Do not write a down-migration in `drizzle/` unless a new forward migration
   explicitly replaces the failed change.

## Stripe

- Live keys (`sk_live_`, `pk_live_`) throw unless `VERCEL_ENV=production`.
- Unsigned or browser returns never mark a statement `PAID`.
- First live statement: use an authorized internal therapist, a small CHF
  total, and watch PaymentIntent metadata `purpose=room_statement`.
- Webhook health: Stripe Dashboard → Developers → Webhooks → delivery
  success. Failures page the billing owner the same day.

## Email

- Local: Mailpit `http://localhost:8025`.
- Production: Resend. Preview `VERCEL_ENV=preview` throws in `sendMail()`;
  room notifications are stored `SKIPPED`.
- Room/account links use `APP_ORIGIN`. Course confirmation stays on the
  marketing origin via `SITE_URL` / `MARKETING_ORIGIN`.

## Scheduler

`vercel.json` hourly `GET /api/cron/rooms` with `Authorization: Bearer ${CRON_SECRET}`.

Response JSON:

```json
{ "ranAt": "...", "ok": true, "reminders": { "considered": 0, "sent": 0 }, "monthClose": { "skipped": false, "finalized": 1, "charged": 1 } }
```

Unauthenticated calls return 401. Job failures return 500, insert an
`ops_heartbeats` row (`ok=false`), and email `OPS_ALERT_EMAIL` when set.

Admin → Settings → Job heartbeats is the in-app evidence. Named response:

| Signal | Action |
| --- | --- |
| Cron 401 | Secret mismatch; rotate `CRON_SECRET` in Vercel and leave the old one until the next hourly run succeeds. |
| Cron 500 / heartbeat Failed | Read Vercel function logs; do **not** finalize or charge from a browser to “catch up” unless the statement is `FINALIZED` or `PAYMENT_FAILED`. Resume uses the same Stripe idempotency key. |
| Stripe webhook failing | Repair the signing secret; replay the event from the Stripe dashboard. |
| Resend bounce / Mailpit empty in prod | Check `RESEND_FROM` domain; inspect `room_notifications` (`FAILED` + `last_error`). Retry is safe for `FAILED` rows. |
| Payment failed | Therapist updates the card; admin Retry. Access is not disabled. |

## Timezone / DST

Booking, usage and month-close use `Europe/Zurich`. Unit coverage lives in
`src/features/rooms/timezone.test.ts` and reservation DST cases. After a spring
or autumn transition, spot-check one booking that crosses 02:00 on the admin
calendar.

## Concurrency

PostgreSQL overlap exclusion plus `FOR UPDATE` charge claims are the production
control. `src/features/rooms/reservations.test.ts` and
`src/features/rooms/charging.test.ts` run concurrent fixtures against local
Postgres. There is no separate k6 suite; do not load-test the production
calendar with synthetic overlapping writes.

## Restore rehearsal log

Record the latest rehearsal here when it is performed against Neon (not this
agent environment):

| Date | Operator | Snapshot / branch | Result |
| --- | --- | --- | --- |
| _Pending live Neon credentials_ | | | Restore cannot be rehearsed in this repository checkout. Procedure above is the accepted method. |
