import type {WaitlistEntry} from "@/db/schema";
import {formatCourseDateRange} from "@/features/courses/dates";
import type {Course} from "@/features/courses/types";
import type {AppLocale} from "@/i18n/routing";

export function waitlistSessionLabel(
  entry: Pick<WaitlistEntry, "courseId" | "courseSessionId">,
  courses: readonly Course[],
  locale: AppLocale,
  pendingLabel: string,
): string {
  if (!entry.courseSessionId) {
    return pendingLabel;
  }

  const course = courses.find((item) => item.id === entry.courseId);
  const session = course?.dates.find((date) => date.id === entry.courseSessionId);
  return session ? formatCourseDateRange(session, locale) : entry.courseSessionId;
}
