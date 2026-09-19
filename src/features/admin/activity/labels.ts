import type {BookingStatus, CourseCallStatus, RoomBookingStatus} from "@/db/schema";

/**
 * Every string a source needs to build a finished row. Sources stay free of
 * `next-intl` so they can be unit-tested with plain fixtures.
 */
export type ActivityCopy = {
  registrationStatus: (status: BookingStatus) => string;
  reservationStatus: (status: RoomBookingStatus) => string;
  callStatus: (status: CourseCallStatus) => string;
  waitlistStatus: (notified: boolean) => string;
  messageTopic: (topic: "course" | "general" | "payment") => string;
  messageReplied: string;
  auditAction: (action: string) => string;
  /** Advice calls and messages may arrive without a course attached. */
  noCourse: string;
  systemActor: string;
  /** "by Marta Python" under a recorded change. */
  actorLine: (actor: string) => string;
};
