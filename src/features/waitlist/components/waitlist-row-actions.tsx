"use client";

import {useState} from "react";

import {
  markWaitlistNotifiedAction,
  removeWaitlistEntryAction,
} from "@/features/waitlist/admin";
import {Button} from "@/shared/ui/button";

export type WaitlistRowActionLabels = {
  notify: string;
  remove: string;
  confirmRemove: string;
  keep: string;
};

/**
 * Quick waiting-list actions next to a row. Removing a contact destroys the
 * only copy of their request, so it asks in place rather than firing on the
 * first click; the safe way out stays the visually stronger control.
 */
export function WaitlistRowActions({
  courseId,
  entryId,
  notified,
  labels,
}: {
  courseId: string;
  entryId: string;
  notified: boolean;
  labels: WaitlistRowActionLabels;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        <form action={removeWaitlistEntryAction.bind(null, courseId, entryId)}>
          <Button type="submit" variant="secondary">
            {labels.confirmRemove}
          </Button>
        </form>
        <Button type="button" onClick={() => setConfirming(false)}>
          {labels.keep}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
      {notified ? null : (
        <form action={markWaitlistNotifiedAction.bind(null, courseId, entryId)}>
          <Button type="submit" variant="secondary">
            {labels.notify}
          </Button>
        </form>
      )}
      <Button type="button" variant="secondary" onClick={() => setConfirming(true)}>
        {labels.remove}
      </Button>
    </div>
  );
}
