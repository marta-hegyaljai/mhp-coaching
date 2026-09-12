import {
  isModuleCourse,
  isProgrammeCourse,
  type Course,
} from "@/features/courses/types";

/** A programme resolved against a catalogue, with its bundle economics. */
export type ProgrammeView = {
  programme: Course;
  modules: Course[];
  /** Sum of the resolved modules; 0 when nothing resolves. */
  modulesPriceChf: number;
  /** Positive only when buying the programme is cheaper than the modules. */
  savingsChf: number;
};

export function splitCatalogueByFormat(courses: readonly Course[]): {
  modules: Course[];
  programmes: Course[];
} {
  const modules: Course[] = [];
  const programmes: Course[] = [];

  for (const course of courses) {
    if (isProgrammeCourse(course)) {
      programmes.push(course);
    } else {
      modules.push(course);
    }
  }

  return {modules, programmes};
}

/** Declared contents of a programme, deduplicated and without blank ids. */
export function programmeModuleIds(course: Pick<Course, "id" | "moduleIds">): string[] {
  if (!Array.isArray(course.moduleIds)) {
    return [];
  }

  const seen = new Set<string>();

  for (const id of course.moduleIds) {
    if (typeof id !== "string") {
      continue;
    }
    const trimmed = id.trim();
    // A programme can never contain itself.
    if (!trimmed || trimmed === course.id) {
      continue;
    }
    seen.add(trimmed);
  }

  return [...seen];
}

/**
 * Resolves a programme against the catalogue it is displayed in. Unknown,
 * unpublished and non-module ids are dropped so a stale link never breaks a
 * page; the caller decides whether it passes the full or published catalogue.
 */
export function resolveProgramme(
  programme: Course,
  catalogue: readonly Course[],
): ProgrammeView {
  const byId = new Map(catalogue.map((course) => [course.id, course]));
  const modules: Course[] = [];

  for (const id of programmeModuleIds(programme)) {
    const course = byId.get(id);
    // Nesting a programme inside a programme is not a supported product shape.
    if (course && isModuleCourse(course)) {
      modules.push(course);
    }
  }

  const modulesPriceChf = modules.reduce(
    (total, course) => total + Math.max(0, course.priceChf),
    0,
  );
  const programmePrice = Math.max(0, programme.priceChf);
  const comparable = modules.length > 1 && modulesPriceChf > 0;

  return {
    programme,
    modules,
    modulesPriceChf,
    savingsChf: comparable ? Math.max(0, modulesPriceChf - programmePrice) : 0,
  };
}

export function resolveProgrammes(catalogue: readonly Course[]): ProgrammeView[] {
  return splitCatalogueByFormat(catalogue).programmes.map((programme) =>
    resolveProgramme(programme, catalogue),
  );
}

/**
 * Normalizes an admin selection into programme contents: only ids that exist
 * in the catalogue and are themselves modules survive, in catalogue order, so
 * a stale or tampered submission never creates a dangling or nested link.
 */
export function selectProgrammeModuleIds(
  catalogue: readonly Course[],
  programmeId: string,
  selected: readonly string[],
): string[] {
  const wanted = new Set(
    selected.map((id) => (typeof id === "string" ? id.trim() : "")).filter(Boolean),
  );

  return catalogue
    .filter(
      (course) =>
        course.id !== programmeId && isModuleCourse(course) && wanted.has(course.id),
    )
    .map((course) => course.id);
}

/** Programmes that advertise the given module, in catalogue order. */
export function findProgrammesForModule(
  moduleId: string,
  catalogue: readonly Course[],
): Course[] {
  if (!moduleId) {
    return [];
  }

  return splitCatalogueByFormat(catalogue).programmes.filter((programme) =>
    programmeModuleIds(programme).includes(moduleId),
  );
}
