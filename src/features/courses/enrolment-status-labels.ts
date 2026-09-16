import type {BookingStatus} from "@/db/schema";

/**
 * One localized name per course-enrolment status, shared by the course record
 * and the admin control panel so the same booking never reads two ways.
 */
export function enrolmentStatusLabels(copy: {
  auth: (key: "status.PAID" | "status.PENDING" | "status.LEAD" | "status.REFUNDED") => string;
  admin: (key: "coursesStatusFailed" | "coursesStatusCancelled") => string;
}): Record<BookingStatus, string> {
  return {
    PAID: copy.auth("status.PAID"),
    PENDING: copy.auth("status.PENDING"),
    LEAD: copy.auth("status.LEAD"),
    REFUNDED: copy.auth("status.REFUNDED"),
    FAILED: copy.admin("coursesStatusFailed"),
    CANCELLED: copy.admin("coursesStatusCancelled"),
  };
}
