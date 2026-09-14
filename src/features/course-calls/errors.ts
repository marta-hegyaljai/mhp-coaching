export type CourseCallErrorCode =
  | "forbidden"
  | "notFound"
  | "invalidHours"
  | "invalidSlot"
  | "slotTaken"
  | "slotUnavailable"
  | "tooSoon"
  | "tooFar"
  | "alreadyCancelled";

export class CourseCallError extends Error {
  constructor(public readonly code: CourseCallErrorCode) {
    super(code);
    this.name = "CourseCallError";
  }
}
