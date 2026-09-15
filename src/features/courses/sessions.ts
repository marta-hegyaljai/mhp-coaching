import type {CourseDate, LocalizedText} from "./types";

export const courseLocation: LocalizedText = {
  fr: "Fribourg",
  de: "Freiburg",
  en: "Fribourg",
};

export const visioLocation: LocalizedText = {
  fr: "Visioconférence",
  de: "Videokonferenz",
  en: "Videoconference",
};

export function session(
  id: string,
  startDate: string,
  endDate?: string,
  options?: {capacity?: number; active?: boolean; location?: LocalizedText},
): CourseDate {
  return {
    id,
    startDate,
    endDate,
    location: options?.location ?? courseLocation,
    capacity: options?.capacity ?? 16,
    active: options?.active ?? true,
  };
}

/**
 * Dates transcribed from the historical public agenda. In-person delivery is
 * Fribourg only; older city names from that agenda are not restored.
 * Café Supervision is the videoconference exception.
 */
export const agendaByCourseId: Record<string, CourseDate[]> = {
  "omni-practitioner": [
    session("omni-practitioner-2026-09-10", "2026-09-10", "2026-09-20"),
    session("omni-practitioner-2026-10-08", "2026-10-08", "2026-10-18"),
    session("omni-practitioner-2026-11-12", "2026-11-12", "2026-11-22"),
  ],
  "advanced-techniques": [
    session("advanced-techniques-2026-09-04", "2026-09-04", "2026-09-06"),
  ],
  "solution-focused-interview": [
    session("solution-focused-interview-2026-09-26", "2026-09-26", "2026-09-27"),
  ],
  "children-hypnosis": [
    session("children-hypnosis-2026-10-03", "2026-10-03", "2026-10-04"),
  ],
  "sport-hypnosis": [
    session("sport-hypnosis-2026-10-24", "2026-10-24", "2026-10-25"),
  ],
  "anxiety-hypnosis": [
    session("anxiety-hypnosis-2026-10-30", "2026-10-30", "2026-11-01"),
  ],
  "illness-hypnosis": [
    session("illness-hypnosis-2026-11-07", "2026-11-07", "2026-11-08"),
  ],
  "addictions-hypnosis": [
    session("addictions-hypnosis-2026-11-28", "2026-11-28", "2026-11-29"),
  ],
  "professional-practice-final-exam": [
    session("professional-practice-final-exam-2026-12-05", "2026-12-05"),
  ],
  "transgenerational-mia": [
    session("transgenerational-mia-2026-04-23", "2026-04-23", "2026-04-26"),
    session("transgenerational-mia-2026-10-16", "2026-10-16"),
  ],
  "chronic-pain-hypnosis": [
    session("chronic-pain-hypnosis-2026-12-05", "2026-12-05"),
  ],
  "stripe-payment-test": [
    session("stripe-payment-test-2026-09-21", "2026-09-21", undefined, {
      capacity: 2,
    }),
  ],
  /**
   * Individual evening sessions. Staff publish or retire dates from the
   * course record; capacity stays at 10 so the group remains small.
   */
  "cafe-supervision": [
    session("cafe-supervision-2026-10-06", "2026-10-06", undefined, {
      capacity: 10,
      location: visioLocation,
    }),
    session("cafe-supervision-2026-10-20", "2026-10-20", undefined, {
      capacity: 10,
      location: visioLocation,
    }),
    session("cafe-supervision-2026-11-03", "2026-11-03", undefined, {
      capacity: 10,
      location: visioLocation,
    }),
    session("cafe-supervision-2026-11-17", "2026-11-17", undefined, {
      capacity: 10,
      location: visioLocation,
    }),
    session("cafe-supervision-2026-12-01", "2026-12-01", undefined, {
      capacity: 10,
      location: visioLocation,
    }),
    session("cafe-supervision-2026-12-15", "2026-12-15", undefined, {
      capacity: 10,
      location: visioLocation,
    }),
  ],
};

export function agendaDates(courseId: string): CourseDate[] {
  return agendaByCourseId[courseId] ?? [];
}
