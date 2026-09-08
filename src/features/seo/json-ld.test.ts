import {describe, expect, it} from "vitest";

import {getCourseById} from "@/features/courses/queries";

import {courseJsonLd, courseListJsonLd, eventJsonLd} from "./json-ld";

describe("structured data", () => {
  it("lists featured courses with locale-correct URLs", () => {
    const course = getCourseById("omni-practitioner");
    expect(course).toBeDefined();

    const list = courseListJsonLd([course!], "de");
    const item = (list.itemListElement as Array<Record<string, unknown>>)[0];

    expect(item.name).toBe(course!.title.de);
    expect(String(item.url)).toContain("/de/ausbildungen/omni-hypnose-praktiker");
  });

  it("emits Course and Event markup with ISO start dates", () => {
    const course = getCourseById("omni-practitioner");
    expect(course).toBeDefined();

    const json = courseJsonLd(course!, "fr");
    expect(json["@type"]).toBe("Course");
    expect(json.inLanguage).toBe("fr");

    const events = eventJsonLd(course!, "en");
    expect(events[0]?.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T09:00:00\+02:00$/);
    expect(String(events[0]?.url)).toContain("/en/courses/omni-hypnosis-practitioner");
  });
});
