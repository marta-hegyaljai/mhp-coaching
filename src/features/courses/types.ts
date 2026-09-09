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

export type CourseCategory = "foundation" | "advanced" | "medical" | "workshop";

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
  dates: CourseDate[];
};

export function isCoursePublished(course: Course): boolean {
  return course.published !== false;
}
