import {listCatalogueFromDatabase} from "@/features/courses/repository";
import {
  getCatalogueCourses,
  getCourseById,
  getPublishedCourseBySlug,
} from "@/features/courses/queries";
import {isCoursePublished, type Course, type CourseCategory} from "@/features/courses/types";

export async function loadCatalogueCourses(): Promise<Course[]> {
  const stored = await listCatalogueFromDatabase();
  return stored.length > 0 ? stored : getCatalogueCourses();
}

export async function loadPublishedCourses(): Promise<Course[]> {
  return (await loadCatalogueCourses()).filter(isCoursePublished);
}

export async function loadCoursesByCategory(
  category: CourseCategory,
): Promise<Course[]> {
  return (await loadPublishedCourses()).filter((course) => course.category === category);
}

export async function loadCourseById(courseId: string): Promise<Course | undefined> {
  const catalogue = await loadCatalogueCourses();
  return catalogue.find((course) => course.id === courseId) ?? getCourseById(courseId);
}

export async function loadPublishedCourseBySlug(slug: string): Promise<Course | undefined> {
  const published = await loadPublishedCourses();
  const match = published.find((course) => Object.values(course.slug).includes(slug));
  return match ?? getPublishedCourseBySlug(slug);
}

export async function loadPublishedCourseById(courseId: string): Promise<Course | undefined> {
  const course = await loadCourseById(courseId);
  return course && isCoursePublished(course) ? course : undefined;
}
