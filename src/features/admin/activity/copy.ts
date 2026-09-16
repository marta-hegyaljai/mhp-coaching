import {getTranslations} from "next-intl/server";

import {isKnownAuditAction} from "@/features/admin/audit-history";
import {enrolmentStatusLabels} from "@/features/courses/enrolment-status-labels";
import type {AppLocale} from "@/i18n/routing";

import type {ActivityCopy} from "./labels";
import {ACTIVITY_KINDS, type ActivityKind} from "./types";

/**
 * Binds the control panel's copy once per request. Sources receive plain
 * functions, so they never reach into `next-intl` themselves.
 */
export async function activityCopy(locale: AppLocale): Promise<ActivityCopy> {
  const [admin, auth, rooms] = await Promise.all([
    getTranslations({locale, namespace: "Admin"}),
    getTranslations({locale, namespace: "Auth"}),
    getTranslations({locale, namespace: "Rooms"}),
  ]);

  const registrationStatuses = enrolmentStatusLabels({auth, admin});

  return {
    registrationStatus: (status) => registrationStatuses[status] ?? status,
    reservationStatus: (status) =>
      status === "CONFIRMED" ? rooms("statusConfirmed") : rooms("statusCancelled"),
    callStatus: (status) =>
      status === "SCHEDULED"
        ? admin("callStatusScheduled")
        : admin("callStatusCancelled"),
    waitlistStatus: (notified) =>
      notified ? admin("coursesWaitlistNotified") : admin("activityWaitlistPending"),
    messageTopic: (topic) => admin(`activityMessageTopics.${topic}`),
    // An unknown action can only come from an older row; never show the enum.
    auditAction: (action) =>
      isKnownAuditAction(action)
        ? admin(`auditActions.${action}`)
        : admin("auditActions.unknown"),
    noCourse: admin("callGeneral"),
    systemActor: admin("auditSystem"),
    actorLine: (actor) => admin("activityActor", {actor}),
  };
}

export type ActivityKindLabels = {
  /** Plural, for the channel filter where a count sits beside the name. */
  filter: Record<ActivityKind, string>;
  /** Singular, for the qualifier chip on a single row. */
  chip: Record<ActivityKind, string>;
};

export async function activityKindLabels(
  locale: AppLocale,
): Promise<ActivityKindLabels> {
  const admin = await getTranslations({locale, namespace: "Admin"});
  const map = (prefix: "activityKinds" | "activityKindLabels") =>
    Object.fromEntries(
      ACTIVITY_KINDS.map((kind) => [kind, admin(`${prefix}.${kind}`)]),
    ) as Record<ActivityKind, string>;

  return {filter: map("activityKinds"), chip: map("activityKindLabels")};
}
