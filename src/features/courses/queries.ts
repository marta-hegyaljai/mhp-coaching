import {routing, type AppLocale} from "@/i18n/routing";

import {courses} from "./catalog";
import {
  defaultDisplayOrderForCourse,
  sortCoursesByCatalogueOrder,
} from "./catalogue-order";
import {isCourseDateBookable} from "./dates";
import {isCoursePublished, type Course, type CourseDate} from "./types";

export function getCatalogueCourses(): Course[] {
  return sortCoursesByCatalogueOrder(
    courses.map((course) => ({
      ...course,
      displayOrder: course.displayOrder ?? defaultDisplayOrderForCourse(course.id),
    })),
  );
}

export function getPublishedCourses(): Course[] {
  return courses.filter(isCoursePublished);
}

function publishedOf(category: Course["category"]): Course[] {
  return getPublishedCourses().filter((course) => course.category === category);
}

export function getFoundationCourses(): Course[] {
  return publishedOf("foundation");
}

export function getAdvancedCourses(): Course[] {
  return publishedOf("advanced");
}

export function getMedicalCourses(): Course[] {
  return publishedOf("medical");
}

export function getWorkshopCourses(): Course[] {
  return publishedOf("workshop");
}

export function getCourseById(id: string): Course | undefined {
  return courses.find((course) => course.id === id);
}

export function getPublishedCourseBySlug(slug: string): Course | undefined {
  return getPublishedCourses().find((course) =>
    Object.values(course.slug).includes(slug),
  );
}

export function getCourseBySlug(slug: string): Course | undefined {
  return getPublishedCourseBySlug(slug);
}

export function getCourseStaticParams(): Array<{
  locale: AppLocale;
  slug: string;
}> {
  return getPublishedCourses().flatMap((course) =>
    routing.locales.map((locale) => ({
      locale,
      slug: course.slug[locale],
    })),
  );
}

export function getCourseDate(
  course: Course,
  courseDateId: string,
): CourseDate | undefined {
  return course.dates.find((date) => date.id === courseDateId);
}

export function getBookableDates(
  course: Course,
  now = new Date(),
): CourseDate[] {
  return course.dates.filter((date) => isCourseDateBookable(date, now));
}
