import {asc, eq} from "drizzle-orm";

import {getDb} from "@/db";
import {courseSessions, courses, type CourseRow, type CourseSessionRow} from "@/db/schema";
import {courses as seedCourses} from "@/features/courses/catalog";
import type {Course, CourseDate} from "@/features/courses/types";
import {isCoursePublished} from "@/features/courses/types";

export function courseFromRows(
  course: CourseRow,
  sessions: CourseSessionRow[],
): Course {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    shortDescription: course.shortDescription,
    description: course.description,
    audience: course.audience,
    duration: course.duration,
    location: course.location,
    priceChf: course.priceChf,
    category: course.category,
    published: course.published,
    dates: sessions.map(sessionFromRow),
  };
}

function sessionFromRow(session: CourseSessionRow): CourseDate {
  return {
    id: session.id,
    startDate: session.startDate,
    endDate: session.endDate ?? undefined,
    location: session.location,
    venue: session.venue ?? undefined,
    capacity: session.capacity,
    active: session.active,
  };
}

export async function upsertSeedCatalogue(): Promise<void> {
  const db = getDb();
  const now = new Date();

  for (const [displayOrder, course] of seedCourses.entries()) {
    await db
      .insert(courses)
      .values({
        id: course.id,
        slug: course.slug,
        title: course.title,
        shortDescription: course.shortDescription,
        description: course.description,
        audience: course.audience,
        duration: course.duration,
        location: course.location,
        priceChf: course.priceChf,
        category: course.category,
        published: isCoursePublished(course),
        displayOrder,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: courses.id,
        set: {
          slug: course.slug,
          title: course.title,
          shortDescription: course.shortDescription,
          description: course.description,
          audience: course.audience,
          duration: course.duration,
          location: course.location,
          priceChf: course.priceChf,
          category: course.category,
          published: isCoursePublished(course),
          displayOrder,
          updatedAt: now,
        },
      });

    const keepIds = course.dates.map((date) => date.id);

    if (keepIds.length === 0) {
      await db.delete(courseSessions).where(eq(courseSessions.courseId, course.id));
    } else {
      const existing = await db
        .select({id: courseSessions.id})
        .from(courseSessions)
        .where(eq(courseSessions.courseId, course.id));

      const staleIds = existing
        .map((row) => row.id)
        .filter((id) => !keepIds.includes(id));

      for (const staleId of staleIds) {
        await db.delete(courseSessions).where(eq(courseSessions.id, staleId));
      }
    }

    for (const [sessionOrder, date] of course.dates.entries()) {
      await db
        .insert(courseSessions)
        .values({
          id: date.id,
          courseId: course.id,
          startDate: date.startDate,
          endDate: date.endDate ?? null,
          location: date.location,
          venue: date.venue ?? null,
          capacity: date.capacity,
          active: date.active,
          displayOrder: sessionOrder,
        })
        .onConflictDoUpdate({
          target: courseSessions.id,
          set: {
            courseId: course.id,
            startDate: date.startDate,
            endDate: date.endDate ?? null,
            location: date.location,
            venue: date.venue ?? null,
            capacity: date.capacity,
            active: date.active,
            displayOrder: sessionOrder,
          },
        });
    }
  }
}

export async function listCatalogueFromDatabase(): Promise<Course[]> {
  const db = getDb();
  const courseRows = await db.select().from(courses).orderBy(asc(courses.displayOrder));
  const sessionRows = await db
    .select()
    .from(courseSessions)
    .orderBy(asc(courseSessions.displayOrder));

  const sessionsByCourse = new Map<string, CourseSessionRow[]>();

  for (const session of sessionRows) {
    const list = sessionsByCourse.get(session.courseId) ?? [];
    list.push(session);
    sessionsByCourse.set(session.courseId, list);
  }

  return courseRows.map((course) =>
    courseFromRows(course, sessionsByCourse.get(course.id) ?? []),
  );
}
