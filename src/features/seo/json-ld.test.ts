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

  it("emits Course markup without events while dates are pending", () => {
    const course = getCourseById("omni-practitioner");
    expect(course).toBeDefined();

    const json = courseJsonLd(course!, "fr");
    expect(json["@type"]).toBe("Course");
    expect(json.inLanguage).toBe("fr");

    const events = eventJsonLd(course!, "en");
    expect(events).toEqual([]);
  });

  it("publishes the MHP Coaching email and phone", () => {
    const json = organizationJsonLd();

    expect(json.email).toBe("contact@mhp-coaching.ch");
    expect(json.telephone).toBe("+41 79 451 44 92");
    expect(JSON.stringify(json)).not.toMatch(/mhp-hypnose/i);
  });
});
