import {describe, expect, it} from "vitest";

import {getCourseById} from "@/features/courses/queries";

import {courseJsonLd, courseListJsonLd, eventJsonLd, organizationJsonLd} from "./json-ld";

describe("structured data", () => {
  it("lists featured courses with locale-correct URLs", () => {
    const course = getCourseById("omni-practitioner");
    expect(course).toBeDefined();

    const list = courseListJsonLd([course!], "de");
    const item = (list.itemListElement as Array<Record<string, unknown>>)[0];

    expect(item.name).toBe(course!.title.de);
    expect(String(item.url)).toContain("/de/ausbildungen/omni-hypnose-praktiker");
  });

  it("emits Course and Event markup for dated courses", () => {
    const course = getCourseById("omni-practitioner");
    expect(course).toBeDefined();

    const json = courseJsonLd(course!, "fr");
    expect(json["@type"]).toBe("Course");
    expect(json.inLanguage).toBe("fr");
    expect((json.hasCourseInstance as unknown[]).length).toBeGreaterThan(0);

    const events = eventJsonLd(course!, "en");
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]?.["@type"]).toBe("Event");
  });

  it("publishes the MHP Coaching email and phone", () => {
    const json = organizationJsonLd();

    expect(json.email).toBe("contact@mhp-coaching.ch");
    expect(json.telephone).toBe("+41 79 451 44 92");
    expect(json.legalName).toBe("MHP Coaching");
    expect((json.address as {streetAddress: string}).streetAddress).toBe(
      "Chemin de la Fenetta 42",
    );
    expect(JSON.stringify(json)).not.toMatch(/mhp-hypnose|Partners Sàrl|CHE-459/i);
  });
});
