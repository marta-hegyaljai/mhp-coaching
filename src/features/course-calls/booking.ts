import type {CourseCall, User} from "@/db/schema";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {canAdminister} from "@/features/auth/policy";
import {recordAudit} from "@/features/auth/repository";
import {utcToZurich} from "@/features/rooms/timezone";

import {findSlot, loadCallAvailability} from "./availability";
import {CourseCallError} from "./errors";
import {cancelScheduledCall, getCourseCallById, insertScheduledCall} from "./repository";

export type ScheduleCourseCallInput = {
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  locale: string;
  courseId?: string;
  courseTitle?: string;
  message?: string;
  privacyAcceptedAt: Date;
  now?: Date;
};

export async function scheduleCourseCall(input: ScheduleCourseCallInput): Promise<CourseCall> {
  const availability = await loadCallAvailability(input.now);
  const slot = findSlot(
    input.date,
    input.time,
    availability.hours,
    availability.booked,
    availability.window,
  );

  if (!slot) {
    throw new CourseCallError("slotUnavailable");
  }

  const inserted = await insertScheduledCall({
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    status: "SCHEDULED",
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    locale: input.locale,
    courseId: input.courseId ?? null,
    courseTitle: input.courseTitle ?? null,
    message: input.message?.trim() ? input.message.trim() : null,
    privacyAcceptedAt: input.privacyAcceptedAt,
  });

  if (!inserted.ok) {
    throw new CourseCallError("slotTaken");
  }

  return inserted.call;
}

export async function cancelCourseCall(input: {actor: User; id: string}): Promise<CourseCall> {
  if (!canAdminister(input.actor)) {
    throw new CourseCallError("forbidden");
  }

  const existing = await getCourseCallById(input.id);
  if (!existing) {
    throw new CourseCallError("notFound");
  }
  if (existing.status === "CANCELLED") {
    throw new CourseCallError("alreadyCancelled");
  }

  const cancelled = await cancelScheduledCall(input.id);
  if (!cancelled) {
    throw new CourseCallError("alreadyCancelled");
  }

  const when = utcToZurich(existing.startsAt);
  await recordAudit({
    actorUserId: input.actor.id,
    action: AUDIT_ACTIONS.COURSE_CALL_CANCELLED,
    before: {
      id: existing.id,
      date: when.date,
      time: when.time,
      email: existing.email,
    },
    after: {id: cancelled.id, status: cancelled.status},
  });

  return cancelled;
}
