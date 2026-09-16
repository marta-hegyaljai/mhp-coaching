import type {Course} from "@/features/courses/types";

/**
 * Default public catalogue order: foundation first, then the advanced modules
 * (the two priority ones first), medical, workshops, Café Supervision, and
 * finally the bundled programmes. Admins may override via `display_order` in
 * PostgreSQL.
 */
export const DEFAULT_CATALOGUE_ORDER = [
  "omni-practitioner",
  "anxiety-hypnosis",
  "advanced-techniques",
  "solution-focused-interview",
  "sport-hypnosis",
  "children-hypnosis",
  "addictions-hypnosis",
  "illness-hypnosis",
  "professional-practice-final-exam",
  "transgenerational-mia",
  "medical-hypnosis-m1",
  "medical-hypnosis-dental-m2",
  "medical-hypnosis-clinical-m2",
  "medical-hypnosis-exam-m3",
  "chronic-pain-hypnosis",
  "birth-preparation",
  "weight-loss-hypnosis",
  "healthy-weight-nutrition-hypnosis",
  "sensory-anchors-hypnosis",
  "magic-laughter-hypnosis",
  "cafe-supervision",
  "stripe-payment-test",
  // Programmes close the catalogue: they are an alternative to the modules above.
  "master-practitioner",
] as const;

export type CatalogueCourseId = (typeof DEFAULT_CATALOGUE_ORDER)[number];

const defaultIndex = new Map<string, number>(
  DEFAULT_CATALOGUE_ORDER.map((id, index) => [id, index]),
);

/** Seed and migration default for one course row. Unknown ids trail the list. */
export function defaultDisplayOrderForCourse(courseId: string): number {
  return defaultIndex.get(courseId) ?? DEFAULT_CATALOGUE_ORDER.length;
}

/** Sort by persisted order, then the canonical default, then id. */
export function sortCoursesByCatalogueOrder<T extends Pick<Course, "id" | "displayOrder">>(
  courses: readonly T[],
): T[] {
  return [...courses].sort((left, right) => {
    const rankLeft = left.displayOrder ?? defaultDisplayOrderForCourse(left.id);
    const rankRight = right.displayOrder ?? defaultDisplayOrderForCourse(right.id);
    if (rankLeft !== rankRight) {
      return rankLeft - rankRight;
    }

    return left.id.localeCompare(right.id);
  });
}
