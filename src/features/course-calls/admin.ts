import type {CourseInquiry, User} from "@/db/schema";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {canAdminister} from "@/features/auth/policy";
import {recordAudit} from "@/features/auth/repository";

import {CourseCallError} from "./errors";
import type {CallHourInput} from "./hours";
import {normalizeCallHours} from "./hours";
import {insertCourseInquiry, listCallHours, replaceCallHours} from "./repository";

export async function saveCallHours(input: {
  actor: User;
  hours: CallHourInput[];
}): Promise<void> {
  if (!canAdminister(input.actor)) {
    throw new CourseCallError("forbidden");
  }

  const before = await listCallHours();
  const intervals = normalizeCallHours(input.hours);
  const after = await replaceCallHours(intervals);

  await recordAudit({
    actorUserId: input.actor.id,
    action: AUDIT_ACTIONS.COURSE_CALL_HOURS_UPDATED,
    before: {
      hours: before.map((item) => ({
        weekday: item.weekday,
        startMinute: item.startMinute,
        endMinute: item.endMinute,
      })),
    },
    after: {
      hours: after.map((item) => ({
        weekday: item.weekday,
        startMinute: item.startMinute,
        endMinute: item.endMinute,
      })),
    },
  });
}

export async function createCourseInquiry(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  locale: string;
  courseId?: string;
  courseTitle?: string;
  privacyAcceptedAt: Date;
}): Promise<CourseInquiry> {
  return insertCourseInquiry({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    message: input.message,
    locale: input.locale,
    courseId: input.courseId ?? null,
    courseTitle: input.courseTitle ?? null,
    privacyAcceptedAt: input.privacyAcceptedAt,
  });
}
