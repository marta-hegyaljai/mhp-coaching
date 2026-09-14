import {describe, expect, it} from "vitest";

import {getCourseById} from "@/features/courses/queries";

import {
  courseJsonLd,
  courseListJsonLd,
  eventJsonLd,
  founderPersonJsonLd,
  homeStatueJsonLd,
  organizationJsonLd,
} from "./json-ld";
import {homeStatue, homeStatueArtist, homeStatueTitle} from "./home-statue";

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
    expect((json.founder as {name: string}).name).toBe("Marta Hegyaljai Python");
    expect(json.sameAs).toEqual(["https://marta-hegyaljai.com/fr/marta-hegyaljai-python"]);
  });

  it("describes the founder as a Person linked to the school", () => {
    const json = founderPersonJsonLd({
      locale: "fr",
      jobTitle: "Fondatrice de MHP Coaching",
      description: "Un parcours riche et reconnu en accompagnement et hypnose.",
      awards: ["Promoting Hypnotism Award, décerné lors du congrès OMNI"],
      pagePath: "/fr/a-propos",
    });
    const graph = json["@graph"] as Array<Record<string, unknown>>;
    const person = graph.find((node) => node["@type"] === "Person");
    const school = graph.find((node) => node["@type"] === "EducationalOrganization");

    expect(person?.name).toBe("Marta Hegyaljai Python");
    expect(person?.jobTitle).toBe("Fondatrice de MHP Coaching");
    expect(person?.alumniOf).toEqual([
      {"@type": "CollegeOrUniversity", name: "Universität Zürich"},
      {"@type": "CollegeOrUniversity", name: "Universität Basel"},
    ]);
    expect(person?.award).toContain("Promoting Hypnotism Award, décerné lors du congrès OMNI");
    expect(person?.sameAs).toEqual(["https://marta-hegyaljai.com/fr/marta-hegyaljai-python"]);
    expect(school?.founder).toEqual({"@id": expect.stringContaining("#marta-hegyaljai-python")});
  });

  it("describes the homepage Obelisk photograph", () => {
    const json = homeStatueJsonLd("fr");
    const creator = json.creator as {name: string};

    expect(json["@type"]).toBe("ImageObject");
    expect(json.name).toBe(homeStatueTitle);
    expect(String(json.contentUrl)).toContain(homeStatue.src);
    expect(json.encodingFormat).toBe("image/webp");
    expect(json.width).toBe(homeStatue.width);
    expect(json.height).toBe(homeStatue.height);
    expect(creator.name).toBe(homeStatueArtist);
  });
});
