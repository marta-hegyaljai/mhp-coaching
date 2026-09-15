import type {AppLocale} from "@/i18n/routing";

export type LocalizedText = Record<AppLocale, string>;

export type CourseDate = {
  id: string;
  startDate: string;
  endDate?: string;
  location: LocalizedText;
  venue?: LocalizedText;
  capacity: number;
  active: boolean;
};

export const COURSE_CATEGORIES = [
  "foundation",
  "advanced",
  "medical",
  "workshop",
  "supervision",
] as const;

export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

export function isCourseCategory(value: unknown): value is CourseCategory {
  return (
    typeof value === "string" &&
    (COURSE_CATEGORIES as readonly string[]).includes(value)
  );
}

/**
 * A `module` is booked on its own and listed inside its category. A
 * `programme` bundles modules into one purchasable path and closes that
 * category, never mixed into the module grid.
 */
export type CourseFormat = "module" | "programme";

export const COURSE_FORMATS: CourseFormat[] = ["module", "programme"];

export type Course = {
  id: string;
  slug: LocalizedText;
  title: LocalizedText;
  shortDescription: LocalizedText;
  description: LocalizedText;
  audience: LocalizedText;
  duration: LocalizedText;
  location: LocalizedText;
  priceChf: number;
  category: CourseCategory;
  /**
   * Catalogue rows stay in source (and later in PostgreSQL) even when paused.
   * Public listings, sitemap and JSON-LD only use published courses.
   */
  published?: boolean;
  displayOrder?: number;
  /** Absent means `module`; legacy rows and fixtures stay valid. */
  format?: CourseFormat;
  /** Declared contents of a programme, in presentation order. */
  moduleIds?: string[];
  dates: CourseDate[];
};

export function isCoursePublished(course: Course): boolean {
  return course.published !== false;
}

export function courseFormatOf(course: Pick<Course, "format">): CourseFormat {
  return course.format === "programme" ? "programme" : "module";
}

export function isProgrammeCourse(course: Pick<Course, "format">): boolean {
  return courseFormatOf(course) === "programme";
}

export function isModuleCourse(course: Pick<Course, "format">): boolean {
  return courseFormatOf(course) === "module";
}

export function parseCourseFormat(value: unknown): CourseFormat {
  return value === "programme" ? "programme" : "module";
}

export function isSupervisionCourse(
  course: Pick<Course, "category">,
): boolean {
  return course.category === "supervision";
}

export function isComplimentaryCourse(
  course: Pick<Course, "priceChf">,
): boolean {
  return course.priceChf === 0;
}
