import {getTranslations} from "next-intl/server";

import {AUDIT_ACTIONS, type AuditAction} from "@/features/admin/audit-actions";
import {
  isKnownAuditAction,
  isKnownAuditField,
  isKnownAuditValue,
  toAuditEventView,
  type AuditFieldKey,
  type AuditValue,
} from "@/features/admin/audit-history";
import {
  AUDIT_HISTORY_HASH,
  userAuditHref,
} from "@/features/admin/audit-history-query";
import {findUsersByIds} from "@/features/auth/repository";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {bookingStamp} from "@/features/rooms/format";
import type {AppLocale} from "@/i18n/routing";
import {formatLongDate, formatMonthYear} from "@/shared/format/calendar-date";
import {Pagination} from "@/shared/ui/pagination";
import {Panel} from "@/shared/ui/panel";
import {SectionLabel} from "@/shared/ui/section-label";

type HistoryEvent = Parameters<typeof toAuditEventView>[0];
type AdminCopy = Awaited<ReturnType<typeof getTranslations<"Admin">>>;

const FIELD_KEYS = {
  isAdmin: "auditFields.isAdmin",
  disabled: "auditFields.disabled",
  pendingInvite: "auditFields.pendingInvite",
  roomBookingEnabled: "auditFields.roomBookingEnabled",
  roomDiscountPercent: "auditFields.roomDiscountPercent",
  emailNormalized: "auditFields.emailNormalized",
  firstName: "auditFields.firstName",
  lastName: "auditFields.lastName",
  locale: "auditFields.locale",
  course: "auditFields.course",
  issuedOn: "auditFields.issuedOn",
  status: "auditFields.status",
  hasDocument: "auditFields.hasDocument",
  slot: "auditFields.slot",
  durationMinutes: "auditFields.durationMinutes",
  amountMinor: "auditFields.amountMinor",
  totalMinor: "auditFields.totalMinor",
  discountPercent: "auditFields.discountPercent",
  billingOutcome: "auditFields.billingOutcome",
  paymentMethod: "auditFields.paymentMethod",
  statementPeriod: "auditFields.statementPeriod",
  billedMinutes: "auditFields.billedMinutes",
  lineCount: "auditFields.lineCount",
  failureCode: "auditFields.failureCode",
  brand: "auditFields.brand",
  last4: "auditFields.last4",
} as const satisfies Record<AuditFieldKey, `auditFields.${AuditFieldKey}`>;

const ACTION_KEYS = Object.fromEntries(
  Object.values(AUDIT_ACTIONS).map((action) => [action, `auditActions.${action}` as const]),
) as Record<AuditAction, `auditActions.${AuditAction}`>;

function padMonth(value: number): string {
  return String(value).padStart(2, "0");
}

function formatAuditValue(value: AuditValue, locale: AppLocale, t: AdminCopy): string {
  switch (value.kind) {
    case "boolean":
      return value.value ? t("auditYes") : t("auditNo");
    case "text":
      return value.value;
    case "percent":
      return t("auditPercent", {percent: value.value});
    case "money":
      return formatChf(minorUnitsToFrancs(value.minor), locale);
    case "minutes":
      return t("auditDuration", {minutes: value.value});
    case "integer":
      return String(value.value);
    case "instant":
      return bookingStamp(new Date(value.iso), locale);
    case "date":
      return formatLongDate(value.iso, locale);
    case "locale":
      return value.value.toUpperCase();
    case "enum":
      return isKnownAuditValue(value.value)
        ? t(`auditValues.${value.value}`)
        : value.value.replaceAll("_", " ");
    case "card":
      return t("auditCard", {
        brand: value.brand,
        last4: value.last4,
        month: padMonth(value.expMonth),
        year: value.expYear,
      });
    case "month":
      return formatMonthYear(`${value.year}-${padMonth(value.month)}-01`, locale);
    case "empty":
      return t("auditEmptyValue");
  }
}

function humanizeField(field: string): string {
  return field
    .replaceAll(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll(/[_-]+/g, " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function actionLabel(action: string, t: AdminCopy): string {
  if (isKnownAuditAction(action)) {
    return t(ACTION_KEYS[action]);
  }
  return t("auditActions.unknown");
}

function fieldLabel(field: string, t: AdminCopy): string {
  if (isKnownAuditField(field)) {
    return t(FIELD_KEYS[field]);
  }
  return humanizeField(field);
}

export async function AccessHistory({
  events,
  locale,
  userId,
  page,
  pageCount,
  total,
}: {
  events: HistoryEvent[];
  locale: AppLocale;
  userId: string;
  page: number;
  pageCount: number;
  total: number;
}) {
  const t = await getTranslations("Admin");
  const actors = await findUsersByIds(
    events
      .map((event) => event.actorUserId)
      .filter((id): id is string => Boolean(id)),
  );
  const actorLabels = new Map(
    actors.map((user) => [user.id, `${user.firstName} ${user.lastName}`]),
  );
  const actorEmails = new Map(actors.map((user) => [user.id, user.email]));

  function actorLine(actorUserId: string | null): {name: string; email: string | null} {
    if (!actorUserId) {
      return {name: t("auditSystem"), email: null};
    }
    return {
      name: actorLabels.get(actorUserId) ?? t("auditUnknownActor"),
      email: actorEmails.get(actorUserId) ?? null,
    };
  }

  return (
    <section id={AUDIT_HISTORY_HASH} className="scroll-mt-8">
      <h2 className="font-serif text-subheading">{t("auditTitle")}</h2>
      {total === 0 ? (
        <p className="mt-4 text-sm leading-7 text-ink-muted">{t("auditEmpty")}</p>
      ) : (
        <>
          <p className="mt-3 font-sans text-sm tabular-nums text-ink-muted">
            {t("auditCount", {shown: events.length, total})}
          </p>
          <ol className="mt-6 space-y-3">
            {events.map((event) => {
              const view = toAuditEventView(event, locale);
              const actor = actorLine(view.actorUserId);

              return (
                <li key={view.id}>
                  <Panel padding="sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <SectionLabel className="text-ink">
                        {actionLabel(view.action, t)}
                      </SectionLabel>
                      <p className="font-sans text-xs tabular-nums text-ink-subtle">
                        {bookingStamp(view.createdAt, locale)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink">
                      {actor.name}
                      {actor.email ? (
                        <span className="text-ink-muted"> · {actor.email}</span>
                      ) : null}
                    </p>
                    {view.summary ? (
                      <p className="mt-1 font-sans text-sm leading-6 tabular-nums text-ink-muted">
                        {view.summary}
                      </p>
                    ) : null}
                    {view.changes.length > 0 ? (
                      <dl className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-[minmax(7rem,11rem)_1fr]">
                        {view.changes.map((change) => {
                          const before = change.before
                            ? formatAuditValue(change.before, locale, t)
                            : null;
                          const after = change.after
                            ? formatAuditValue(change.after, locale, t)
                            : null;

                          return (
                            <div key={change.field} className="contents">
                              <dt className="text-sm text-ink-muted">
                                {fieldLabel(change.field, t)}
                              </dt>
                              <dd className="font-sans text-sm leading-6 tabular-nums text-ink">
                                {before && after && before !== after ? (
                                  <>
                                    <span className="text-ink-muted">{before}</span>
                                    <span aria-hidden="true"> → </span>
                                    <span>{after}</span>
                                  </>
                                ) : (
                                  (after ?? before)
                                )}
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                    ) : null}
                  </Panel>
                </li>
              );
            })}
          </ol>
          {pageCount > 1 ? (
            <Pagination
              className="mt-6"
              previous={page > 1 ? userAuditHref(userId, page - 1) : null}
              next={page < pageCount ? userAuditHref(userId, page + 1) : null}
              status={t("pageStatus", {page, pageCount})}
              labels={{previous: t("previous"), next: t("next")}}
            />
          ) : null}
        </>
      )}
    </section>
  );
}
