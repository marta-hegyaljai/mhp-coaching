import {getTranslations} from "next-intl/server";

import type {RoomBookingEvent} from "@/db/schema";
import {findUserById} from "@/features/auth/repository";
import {bookingSpanLabel, bookingStamp} from "@/features/rooms/format";
import type {AppLocale} from "@/i18n/routing";
import {Panel} from "@/shared/ui/panel";
import {SectionLabel} from "@/shared/ui/section-label";

type HistoryActionKey =
  | "historyCreated"
  | "historyMoved"
  | "historyCancelled"
  | "historyWaived"
  | "historyAdminCreated"
  | "historyAdminMoved";

const actionKeys: Record<string, HistoryActionKey> = {
  MOVED: "historyMoved",
  CANCELLED: "historyCancelled",
  WAIVED: "historyWaived",
  ADMIN_CREATED: "historyAdminCreated",
  ADMIN_MOVED: "historyAdminMoved",
};

type Snapshot = {roomName?: string; startsAt?: string; endsAt?: string};

/** Reads the room and span out of a snapshot without trusting its shape. */
function snapshotSpan(
  after: RoomBookingEvent["after"],
  locale: AppLocale,
): string | null {
  const {roomName, startsAt, endsAt} = (after ?? {}) as Snapshot;
  if (!roomName || !startsAt || !endsAt) {
    return null;
  }

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return `${roomName} · ${bookingSpanLabel(start, end, locale)}`;
}

/** The append-only trail for one booking, newest entries in stored order. */
export async function BookingHistory({
  events,
  locale,
  className = "",
}: {
  events: RoomBookingEvent[];
  locale: AppLocale;
  className?: string;
}) {
  const t = await getTranslations("Admin");
  const actorIds = [...new Set(events.map((event) => event.actorUserId).filter(Boolean))];
  const actors = await Promise.all(actorIds.map((actorId) => findUserById(actorId as string)));
  const actorNames = new Map(
    actors
      .filter((user): user is NonNullable<typeof user> => Boolean(user))
      .map((user) => [user.id, `${user.firstName} ${user.lastName}`]),
  );

  return (
    <section className={className}>
      <h2 className="font-serif text-subheading">{t("historyTitle")}</h2>
      {events.length === 0 ? (
        <p className="mt-4 text-sm leading-7 text-ink-muted">{t("historyEmpty")}</p>
      ) : (
        <ol className="mt-6 space-y-3">
          {events.map((event) => {
            const span = snapshotSpan(event.after, locale);

            return (
              <li key={event.id}>
                <Panel padding="sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <SectionLabel className="text-ink">
                      {t(actionKeys[event.action] ?? "historyCreated")}
                    </SectionLabel>
                    <p className="font-sans text-xs tabular-nums text-ink-subtle">
                      {bookingStamp(event.createdAt, locale)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink">
                    {event.actorUserId
                      ? (actorNames.get(event.actorUserId) ?? t("historyActor"))
                      : t("auditSystem")}
                  </p>
                  {span ? (
                    <p className="mt-1 font-sans text-sm leading-6 tabular-nums text-ink-muted">
                      {span}
                    </p>
                  ) : null}
                </Panel>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
