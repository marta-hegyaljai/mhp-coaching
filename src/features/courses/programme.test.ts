import {describe, expect, it} from "vitest";

import {
  findProgrammesForModule,
  programmeModuleIds,
  resolveProgramme,
  resolveProgrammes,
  selectProgrammeModuleIds,
  splitCatalogueByFormat,
} from "./programme";
import type {Course, CourseFormat} from "./types";

const text = (value: string) => ({fr: value, de: value, en: value});

function course(
  id: string,
  overrides: Partial<Course> & {format?: CourseFormat} = {},
): Course {
  return {
    id,
    slug: text(id),
    title: text(id),
    shortDescription: text(id),
    description: text(id),
    audience: text(id),
    duration: text(id),
    location: text(id),
    priceChf: 100,
    category: "advanced",
    dates: [],
    ...overrides,
  };
}

describe("splitCatalogueByFormat", () => {
  it("treats a missing format as an individual module", () => {
    const {modules, programmes} = splitCatalogueByFormat([
      course("a"),
      course("path", {format: "programme"}),
      course("b", {format: "module"}),
    ]);

    expect(modules.map((item) => item.id)).toEqual(["a", "b"]);
    expect(programmes.map((item) => item.id)).toEqual(["path"]);
  });
});

describe("programmeModuleIds", () => {
  it("drops blanks, duplicates and self-references", () => {
    expect(
      programmeModuleIds({
        id: "path",
        moduleIds: ["a", " ", "a", "path", "b"],
      }),
    ).toEqual(["a", "b"]);
  });

  it("tolerates a missing or malformed list", () => {
    expect(programmeModuleIds({id: "path"})).toEqual([]);
    expect(
      programmeModuleIds({
        id: "path",
        moduleIds: [null, 3] as unknown as string[],
      }),
    ).toEqual([]);
  });
});

describe("resolveProgramme", () => {
  const catalogue = [
    course("a", {priceChf: 800}),
    course("b", {priceChf: 700}),
    course("other-path", {format: "programme"}),
  ];

  it("keeps the declared module order and computes the bundle saving", () => {
    const view = resolveProgramme(
      course("path", {format: "programme", priceChf: 1200, moduleIds: ["b", "a"]}),
      catalogue,
    );

    expect(view.modules.map((item) => item.id)).toEqual(["b", "a"]);
    expect(view.modulesPriceChf).toBe(1500);
    expect(view.savingsChf).toBe(300);
  });

  it("ignores unknown ids and nested programmes", () => {
    const view = resolveProgramme(
      course("path", {
        format: "programme",
        priceChf: 500,
        moduleIds: ["a", "ghost", "other-path"],
      }),
      catalogue,
    );

    expect(view.modules.map((item) => item.id)).toEqual(["a"]);
  });

  it("reports no saving for a single module or a programme priced above its parts", () => {
    const single = resolveProgramme(
      course("path", {format: "programme", priceChf: 100, moduleIds: ["a"]}),
      catalogue,
    );
    const expensive = resolveProgramme(
      course("path", {format: "programme", priceChf: 9000, moduleIds: ["a", "b"]}),
      catalogue,
    );

    expect(single.savingsChf).toBe(0);
    expect(expensive.savingsChf).toBe(0);
  });

  it("stays safe when the programme declares nothing", () => {
    const view = resolveProgramme(course("path", {format: "programme"}), catalogue);

    expect(view.modules).toEqual([]);
    expect(view.modulesPriceChf).toBe(0);
    expect(view.savingsChf).toBe(0);
  });
});

describe("resolveProgrammes", () => {
  it("resolves every programme against the same catalogue", () => {
    const catalogue = [
      course("a"),
      course("path", {format: "programme", moduleIds: ["a"]}),
    ];

    expect(resolveProgrammes(catalogue)).toHaveLength(1);
    expect(resolveProgrammes(catalogue)[0]?.modules.map((item) => item.id)).toEqual(["a"]);
  });
});

describe("selectProgrammeModuleIds", () => {
  const catalogue = [
    course("a"),
    course("b"),
    course("path", {format: "programme"}),
    course("other-path", {format: "programme"}),
  ];

  it("returns the selection in catalogue order, not submission order", () => {
    expect(selectProgrammeModuleIds(catalogue, "path", ["b", "a"])).toEqual(["a", "b"]);
  });

  it("rejects unknown ids, other programmes and the programme itself", () => {
    expect(
      selectProgrammeModuleIds(catalogue, "path", ["a", "ghost", "other-path", "path"]),
    ).toEqual(["a"]);
  });

  it("tolerates padding, duplicates and an empty selection", () => {
    expect(selectProgrammeModuleIds(catalogue, "path", [" a ", "a", ""])).toEqual(["a"]);
    expect(selectProgrammeModuleIds(catalogue, "path", [])).toEqual([]);
  });
});

describe("findProgrammesForModule", () => {
  const catalogue = [
    course("a"),
    course("path", {format: "programme", moduleIds: ["a"]}),
    course("other-path", {format: "programme", moduleIds: ["b"]}),
  ];

  it("finds every programme advertising the module", () => {
    expect(findProgrammesForModule("a", catalogue).map((item) => item.id)).toEqual(["path"]);
    expect(findProgrammesForModule("b", catalogue).map((item) => item.id)).toEqual([
      "other-path",
    ]);
    expect(findProgrammesForModule("", catalogue)).toEqual([]);
    expect(findProgrammesForModule("ghost", catalogue)).toEqual([]);
  });
});
