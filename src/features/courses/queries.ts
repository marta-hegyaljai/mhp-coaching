import {routing, type AppLocale} from "@/i18n/routing";

import {courses} from "./catalog";
import {isCourseDateBookable} from "./dates";
import type {Course, CourseDate} from "./types";

export function getPublishedCourses(): Course[] {
  return courses;
}

export function getFoundationCourses(): Course[] {
  return courses.filter((course) => course.category === "foundation");
}

export function getAdvancedCourses(): Course[] {
  return courses.filter((course) => course.category === "advanced");
}

export function getMedicalCourses(): Course[] {
  return courses.filter((course) => course.category === "medical");
}

export function getWorkshopCourses(): Course[] {
  return courses.filter((course) => course.category === "workshop");
}

export function getCourseById(id: string): Course | undefined {
  return courses.find((course) => course.id === id);
}

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((course) =>
    Object.values(course.slug).includes(slug),
  );
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
