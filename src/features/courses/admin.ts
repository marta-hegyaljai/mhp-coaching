"use server";

import {revalidatePath} from "next/cache";
import {randomUUID} from "node:crypto";

import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {canAdminister} from "@/features/auth/policy";
import {recordAudit} from "@/features/auth/repository";
import {readSessionUser} from "@/features/auth/session";
import {defaultDisplayOrderForCourse} from "@/features/courses/catalogue-order";
import {loadCatalogueCourses, loadCourseById} from "@/features/courses/live";
import {
  createCourseSession,
  deleteCourseSession,
  listCatalogueFromDatabase,
  setProgrammeModules,
  swapCourseDisplayOrder,
  updateCourse,
  updateCourseSession,
  type CourseSessionCreateInput,
  type CourseSessionUpdateInput,
  type CourseUpdateInput,
} from "@/features/courses/repository";
import {selectProgrammeModuleIds} from "@/features/courses/programme";
import {
  isCourseCategory,
  parseCourseAvailability,
  parseCourseFormat,
  parseSessionAvailability,
} from "@/features/courses/types";
import type {LocalizedJson} from "@/db/schema";

export type CourseAdminState = {
  error?: CourseAdminError;
  success?: CourseAdminSuccess;
};

export type CourseAdminError =
  | "missing"
  | "localized"
  | "price"
  | "session"
  | "dates"
  | "slug"
  | "forbidden"
  | "sessionHasEnrolments";

export type CourseAdminSuccess = "saved" | "session" | "created" | "deleted";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readInt(formData: FormData, key: string) {
  const value = Number.parseInt(readString(formData, key), 10);
  return Number.isFinite(value) ? value : null;
}

function parseLocalized(formData: FormData, prefix: string): LocalizedJson {
  return {
    fr: readString(formData, `${prefix}.fr`),
    de: readString(formData, `${prefix}.de`),
    en: readString(formData, `${prefix}.en`),
  };
}

function isComplete(value: LocalizedJson) {
  return Boolean(value.fr && value.de && value.en);
}

function isEmpty(value: LocalizedJson) {
  return !value.fr && !value.de && !value.en;
}

async function requireAdminActor() {
  const actor = await readSessionUser();
  if (!actor || !canAdminister(actor)) {
    return null;
  }
  return actor;
}

function parseCoursePatch(formData: FormData): CourseUpdateInput | CourseAdminError {
  const slug = parseLocalized(formData, "slug");
  const title = parseLocalized(formData, "title");
  const shortDescription = parseLocalized(formData, "shortDescription");
  const description = parseLocalized(formData, "description");
  const audience = parseLocalized(formData, "audience");
  const duration = parseLocalized(formData, "duration");
  const location = parseLocalized(formData, "location");
  const categoryRaw = readString(formData, "category");
  const priceChf = Number.parseInt(readString(formData, "priceChf"), 10);
  if (
    !isComplete(slug) ||
    !isComplete(title) ||
    !isComplete(shortDescription) ||
    !isComplete(description) ||
    !isComplete(audience) ||
    !isComplete(duration) ||
    !isComplete(location)
  ) {
    return "localized";
  }
  if (!Number.isInteger(priceChf) || priceChf < 0) {
    return "price";
  }

  const category = isCourseCategory(categoryRaw) ? categoryRaw : "foundation";

  return {
    slug,
    title,
    shortDescription,
    description,
    audience,
    duration,
    location,
    priceChf,
    category,
    format: parseCourseFormat(readString(formData, "format")),
    published: formData.get("published") === "on",
    availability: parseCourseAvailability(readString(formData, "availability")),
    displayOrder: 0,
  };
}

function readSelectedModuleIds(formData: FormData): string[] {
  return formData.getAll("moduleIds").map((value) => String(value));
}

function parseSessionPatch(formData: FormData): CourseSessionUpdateInput | CourseAdminError {
  const startDate = readString(formData, "startDate");
  const endDateRaw = readString(formData, "endDate");
  const capacity = readInt(formData, "capacity");
  const location = parseLocalized(formData, "location");
  const venue = parseLocalized(formData, "venue");

  if (!startDate || !capacity || capacity < 1) {
    return "session";
  }
  const endDate = endDateRaw.length > 0 ? endDateRaw : null;
  if (endDate && endDate < startDate) {
    return "dates";
  }
  if (!isComplete(location)) {
    return "localized";
  }
  if (!isEmpty(venue) && !isComplete(venue)) {
    return "localized";
  }

  return {
    startDate,
    endDate,
    location,
    venue: isEmpty(venue) ? null : venue,
    capacity,
    active: formData.get("active") === "on",
    availability: parseSessionAvailability(readString(formData, "availability")),
  };
}

function slugTaken(catalogue: Awaited<ReturnType<typeof loadCatalogueCourses>>, slug: LocalizedJson, exceptId: string) {
  const values = new Set(Object.values(slug));
  return catalogue.some((course) => {
    if (course.id === exceptId) {
      return false;
    }
    return Object.values(course.slug).some((value) => values.has(value));
  });
}

export async function updateCourseAction(
  _prev: CourseAdminState | null,
  formData: FormData,
): Promise<CourseAdminState> {
  const admin = await requireAdminActor();
  if (!admin) {
    return {error: "forbidden"};
  }

  const courseId = readString(formData, "courseId");
  if (!courseId) {
    return {error: "missing"};
  }

  const patch = parseCoursePatch(formData);
  if (typeof patch === "string") {
    return {error: patch};
  }

  const existing = await loadCourseById(courseId);
  if (!existing) {
    return {error: "missing"};
  }

  const catalogue = await loadCatalogueCourses();
  if (slugTaken(catalogue, patch.slug, courseId)) {
    return {error: "slug"};
  }

  const moduleIds =
    patch.format === "programme"
      ? selectProgrammeModuleIds(catalogue, courseId, readSelectedModuleIds(formData))
      : [];

  await updateCourse(courseId, {
    ...patch,
    displayOrder: existing.displayOrder ?? 0,
  });
  // Demoting a programme back to a module clears its contents.
  await setProgrammeModules(courseId, moduleIds);
  await recordAudit({
    actorUserId: admin.id,
    action: AUDIT_ACTIONS.COURSE_UPDATED,
    after: {
      courseId,
      published: patch.published,
      availability: patch.availability,
      format: patch.format,
      moduleCount: moduleIds.length,
      title: patch.title.en,
    },
  });
  revalidatePath("/", "layout");
  return {success: "saved"};
}

export async function updateCourseSessionAction(
  _prev: CourseAdminState | null,
  formData: FormData,
): Promise<CourseAdminState> {
  const admin = await requireAdminActor();
  if (!admin) {
    return {error: "forbidden"};
  }

  const sessionId = readString(formData, "sessionId");
  const courseId = readString(formData, "courseId");
  const patch = parseSessionPatch(formData);
  if (!sessionId || !courseId) {
    return {error: "session"};
  }
  if (typeof patch === "string") {
    return {error: patch};
  }

  await updateCourseSession(sessionId, patch);
  await recordAudit({
    actorUserId: admin.id,
    action: AUDIT_ACTIONS.COURSE_SESSION_UPDATED,
    after: {
      courseId,
      sessionId,
      active: patch.active,
      availability: patch.availability,
      startDate: patch.startDate,
    },
  });
  revalidatePath("/", "layout");
  return {success: "session"};
}

export async function reorderCourseAction(
  _locale: string,
  _prev: CourseAdminState | null,
  formData: FormData,
): Promise<CourseAdminState> {
  const admin = await requireAdminActor();
  if (!admin) {
    return {error: "forbidden"};
  }

  const courseId = readString(formData, "courseId");
  const direction = readString(formData, "direction");
  if (!courseId || (direction !== "up" && direction !== "down")) {
    return {error: "missing"};
  }

  const ordered = await listCatalogueFromDatabase();
  const index = ordered.findIndex((course) => course.id === courseId);
  const current = ordered[index];
  const swapWith = direction === "up" ? ordered[index - 1] : ordered[index + 1];

  if (!current || !swapWith) {
    return {error: "missing"};
  }

  await swapCourseDisplayOrder(
    {
      id: current.id,
      displayOrder: current.displayOrder ?? defaultDisplayOrderForCourse(current.id),
    },
    {
      id: swapWith.id,
      displayOrder: swapWith.displayOrder ?? defaultDisplayOrderForCourse(swapWith.id),
    },
  );
  await recordAudit({
    actorUserId: admin.id,
    action: AUDIT_ACTIONS.COURSE_REORDERED,
    before: {courseId: current.id, displayOrder: current.displayOrder},
    after: {courseId: current.id, displayOrder: swapWith.displayOrder},
  });
  revalidatePath("/", "layout");
  return {success: "saved"};
}

export async function createCourseSessionAction(
  _prev: CourseAdminState | null,
  formData: FormData,
): Promise<CourseAdminState> {
  const admin = await requireAdminActor();
  if (!admin) {
    return {error: "forbidden"};
  }

  const courseId = readString(formData, "courseId");
  if (!courseId) {
    return {error: "missing"};
  }

  const course = await loadCourseById(courseId);
  if (!course) {
    return {error: "missing"};
  }

  const patch = parseSessionPatch(formData);
  if (typeof patch === "string") {
    return {error: patch};
  }

  const input: CourseSessionCreateInput = {
    id: `session-${randomUUID().slice(0, 8)}`,
    courseId,
    ...patch,
    location: isComplete(patch.location) ? patch.location : course.location,
  };

  await createCourseSession(input);
  await recordAudit({
    actorUserId: admin.id,
    action: AUDIT_ACTIONS.COURSE_SESSION_CREATED,
    after: {
      courseId,
      sessionId: input.id,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  });
  revalidatePath("/", "layout");
  return {success: "created"};
}

export async function deleteCourseSessionAction(
  _prev: CourseAdminState | null,
  formData: FormData,
): Promise<CourseAdminState> {
  const admin = await requireAdminActor();
  if (!admin) {
    return {error: "forbidden"};
  }

  const sessionId = readString(formData, "sessionId");
  const courseId = readString(formData, "courseId");
  if (!sessionId || !courseId) {
    return {error: "session"};
  }

  const result = await deleteCourseSession({id: sessionId, courseId});
  if (result === "missing") {
    return {error: "session"};
  }
  if (result === "hasEnrolments") {
    return {error: "sessionHasEnrolments"};
  }

  await recordAudit({
    actorUserId: admin.id,
    action: AUDIT_ACTIONS.COURSE_SESSION_DELETED,
    after: {courseId, sessionId},
  });
  revalidatePath("/", "layout");
  return {success: "deleted"};
}
