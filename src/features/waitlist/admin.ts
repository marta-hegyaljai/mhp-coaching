"use server";

import {revalidatePath} from "next/cache";

import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {canAdminister} from "@/features/auth/policy";
import {recordAudit} from "@/features/auth/repository";
import {readSessionUser} from "@/features/auth/session";

import {deleteWaitlistEntry, markWaitlistNotified} from "./repository";

export async function markWaitlistNotifiedAction(
  courseId: string,
  entryId: string,
): Promise<void> {
  const actor = await readSessionUser();
  if (!actor || !canAdminister(actor)) {
    return;
  }

  const entry = await markWaitlistNotified({id: entryId, courseId});
  if (!entry) {
    return;
  }

  await recordAudit({
    actorUserId: actor.id,
    action: AUDIT_ACTIONS.WAITLIST_MARKED_NOTIFIED,
    after: {
      courseId: entry.courseId,
      waitlistId: entry.id,
      email: entry.email,
    },
  });
  revalidatePath("/", "layout");
}

/**
 * Takes a contact off a waiting list. The row is gone, so the audit snapshot is
 * the only remaining record of who was removed and by whom.
 */
export async function removeWaitlistEntryAction(
  courseId: string,
  entryId: string,
): Promise<void> {
  const actor = await readSessionUser();
  if (!actor || !canAdminister(actor)) {
    return;
  }

  const entry = await deleteWaitlistEntry({id: entryId, courseId});
  if (!entry) {
    return;
  }

  await recordAudit({
    actorUserId: actor.id,
    action: AUDIT_ACTIONS.WAITLIST_ENTRY_REMOVED,
    before: {
      courseId: entry.courseId,
      waitlistId: entry.id,
      email: entry.email,
      firstName: entry.firstName,
      lastName: entry.lastName,
    },
  });
  revalidatePath("/", "layout");
}
