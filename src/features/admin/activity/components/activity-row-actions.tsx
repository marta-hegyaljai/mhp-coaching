import {adminMessageHref} from "@/features/inquiries/admin-message";
import {
  WaitlistRowActions,
  type WaitlistRowActionLabels,
} from "@/features/waitlist/components/waitlist-row-actions";
import {Link} from "@/i18n/navigation";
import {buttonStyles} from "@/shared/ui/button";

import type {ActivityEntry} from "../types";

export type ActivityActionLabels = {
  waitlist: WaitlistRowActionLabels;
  reply: string;
};

/**
 * Row-level actions the panel can complete without leaving the page. Channels
 * whose only action is "read the record" rely on the title link instead.
 */
export function ActivityRowActions({
  entry,
  labels,
}: {
  entry: ActivityEntry;
  labels: ActivityActionLabels;
}) {
  if (entry.source.kind === "registration" && entry.source.lead) {
    return (
      <Link
        href={adminMessageHref(entry.source.bookingId, "lead")}
        className={buttonStyles({variant: "secondary"})}
      >
        {labels.reply}
      </Link>
    );
  }

  if (entry.source.kind !== "waitlist") {
    return null;
  }

  return (
    <WaitlistRowActions
      courseId={entry.source.courseId}
      entryId={entry.source.entryId}
      notified={entry.source.notified}
      labels={labels.waitlist}
    />
  );
}

export function hasRowActions(entry: ActivityEntry): boolean {
  return (
    entry.source.kind === "waitlist" ||
    (entry.source.kind === "registration" && entry.source.lead)
  );
}
