import sourceContentJson from "./source-content.json";

import type {Course} from "./types";

export type CourseSourceSection = {
  title: string;
  items: string[];
};

export type CourseSourceContent = {
  intro: string | null;
  sections: CourseSourceSection[];
};

const sourceContent = sourceContentJson as Record<string, CourseSourceContent>;

export function getCourseSourceContent(course: Course): CourseSourceContent {
  const content = sourceContent[course.id];

  if (!content) {
    throw new Error(`Missing legacy source content for course: ${course.id}`);
  }

  return content;
}

export function getCourseImage(course: Course) {
  return `/images/courses/${course.id}.webp`;
}
