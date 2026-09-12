import {asc, eq, inArray} from "drizzle-orm";

import {getDb} from "@/db";
import {
  courseProgrammeModules,
  courseSessions,
  courses,
  type CourseProgrammeModuleRow,
  type CourseRow,
  type CourseSessionRow,
  type LocalizedJson,
} from "@/db/schema";
import {courses as seedCourses} from "@/features/courses/catalog";
import {
  DEFAULT_CATALOGUE_ORDER,
  defaultDisplayOrderForCourse,
  sortCoursesByCatalogueOrder,
} from "@/features/courses/catalogue-order";
import {programmeModuleIds} from "@/features/courses/programme";
import type {
  Course,
  CourseCategory,
  CourseDate,
  CourseFormat,
} from "@/features/courses/types";
import {courseFormatOf, isCoursePublished} from "@/features/courses/types";

export function courseFromRows(
  course: CourseRow,
  sessions: CourseSessionRow[],
  moduleIds: string[] = [],
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
    format: course.format,
    moduleIds: course.format === "programme" ? moduleIds : undefined,
    published: course.published,
    displayOrder: course.displayOrder,
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

  for (const course of seedCourses) {
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
        format: courseFormatOf(course),
        published: isCoursePublished(course),
        displayOrder: defaultDisplayOrderForCourse(course.id),
        updatedAt: now,
      })
      .onConflictDoNothing();

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
        .onConflictDoNothing();
    }
  }

  // Second pass: programme links need every referenced course row to exist.
  for (const course of seedCourses) {
    const moduleIds = programmeModuleIds(course);
    if (courseFormatOf(course) !== "programme" || moduleIds.length === 0) {
      continue;
    }

    for (const [displayOrder, moduleId] of moduleIds.entries()) {
      await db
        .insert(courseProgrammeModules)
        .values({programmeId: course.id, moduleId, displayOrder})
        .onConflictDoNothing();
    }
  }
}

async function readProgrammeModuleIds(
  programmeIds: string[],
): Promise<Map<string, string[]>> {
  const byProgramme = new Map<string, string[]>();
  if (programmeIds.length === 0) {
    return byProgramme;
  }

  const rows: CourseProgrammeModuleRow[] = await getDb()
    .select()
    .from(courseProgrammeModules)
    .where(inArray(courseProgrammeModules.programmeId, programmeIds))
    .orderBy(asc(courseProgrammeModules.displayOrder));

  for (const row of rows) {
    const list = byProgramme.get(row.programmeId) ?? [];
    list.push(row.moduleId);
    byProgramme.set(row.programmeId, list);
  }

  return byProgramme;
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

  const modulesByProgramme = await readProgrammeModuleIds(
    courseRows.filter((course) => course.format === "programme").map((course) => course.id),
  );

  return sortCoursesByCatalogueOrder(
    courseRows.map((course) =>
      courseFromRows(
        course,
        sessionsByCourse.get(course.id) ?? [],
        modulesByProgramme.get(course.id) ?? [],
      ),
    ),
  );
}

/** One-time or migration helper; does not run on ordinary catalogue reseeds. */
export async function applyDefaultCatalogueDisplayOrders(): Promise<void> {
  const db = getDb();
  const now = new Date();

  for (const [displayOrder, courseId] of DEFAULT_CATALOGUE_ORDER.entries()) {
    await db
      .update(courses)
      .set({displayOrder, updatedAt: now})
      .where(eq(courses.id, courseId));
  }
}

export async function swapCourseDisplayOrder(
  first: {id: string; displayOrder: number},
  second: {id: string; displayOrder: number},
): Promise<void> {
  const db = getDb();
  const now = new Date();

  await db
    .update(courses)
    .set({displayOrder: second.displayOrder, updatedAt: now})
    .where(eq(courses.id, first.id));

  await db
    .update(courses)
    .set({displayOrder: first.displayOrder, updatedAt: now})
    .where(eq(courses.id, second.id));
}

export type CourseUpdateInput = {
  slug: LocalizedJson;
  title: LocalizedJson;
  shortDescription: LocalizedJson;
  description: LocalizedJson;
  audience: LocalizedJson;
  duration: LocalizedJson;
  location: LocalizedJson;
  priceChf: number;
  category: CourseCategory;
  format: CourseFormat;
  published: boolean;
  displayOrder: number;
};

export type CourseSessionUpdateInput = {
  startDate: string;
  endDate: string | null;
  location: LocalizedJson;
  venue: LocalizedJson | null;
  capacity: number;
  active: boolean;
};

export type CourseSessionCreateInput = CourseSessionUpdateInput & {
  id: string;
  courseId: string;
};

export async function updateCourse(id: string, patch: CourseUpdateInput): Promise<void> {
  await getDb()
    .update(courses)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, id));
}

/**
 * Replaces the contents of a programme. Passing an empty list (or demoting a
 * programme back to a module) simply clears the links.
 */
export async function setProgrammeModules(
  programmeId: string,
  moduleIds: string[],
): Promise<void> {
  await getDb().transaction(async (tx) => {
    await tx
      .delete(courseProgrammeModules)
      .where(eq(courseProgrammeModules.programmeId, programmeId));

    if (moduleIds.length === 0) {
      return;
    }

    await tx.insert(courseProgrammeModules).values(
      moduleIds.map((moduleId, displayOrder) => ({
        programmeId,
        moduleId,
        displayOrder,
      })),
    );
  });
}

export async function updateCourseSession(
  id: string,
  patch: CourseSessionUpdateInput,
): Promise<void> {
  await getDb().update(courseSessions).set(patch).where(eq(courseSessions.id, id));
}

export async function createCourseSession(input: CourseSessionCreateInput): Promise<void> {
  const existing = await getDb()
    .select({displayOrder: courseSessions.displayOrder})
    .from(courseSessions)
    .where(eq(courseSessions.courseId, input.courseId));
  const displayOrder =
    existing.reduce((max, row) => Math.max(max, row.displayOrder), -1) + 1;

  await getDb().insert(courseSessions).values({
    ...input,
    displayOrder,
  });
}
