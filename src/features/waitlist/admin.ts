"use server";

import {revalidatePath} from "next/cache";

import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {canAdminister} from "@/features/auth/policy";
import {recordAudit} from "@/features/auth/repository";
import {readSessionUser} from "@/features/auth/session";

import {markWaitlistNotified} from "./repository";

export async function markWaitlistNotifiedAction(
  courseId: string,
  entryId: string,
): Promise<void> {
  const actor = await readSessionUser();
  if (!actor || !canAdminister(actor)) {
    return;
  }

  const entry = await markWaitlistNotified(entryId);
  if (!entry || entry.courseId !== courseId) {
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
