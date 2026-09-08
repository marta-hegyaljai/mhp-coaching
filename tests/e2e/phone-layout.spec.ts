import {expect, test} from "@playwright/test";

const phonePaths = [
  "/fr",
  "/fr/formations",
  "/fr/formations/praticien-hypnose-omni",
  "/fr/formations/praticien-hypnose-omni/inscription",
  "/fr/contact",
  "/de",
  "/de/ausbildungen/omni-hypnose-praktiker",
  "/en",
  "/en/courses/omni-hypnosis-practitioner",
];

test.describe("phone layout", () => {
  test.use({viewport: {width: 390, height: 844}});

  for (const path of phonePaths) {
    test(`${path} fits a 390px viewport`, async ({page}) => {
      await page.goto(path);

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );

      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("phone header keeps brand, courses, contact and language on one row", async ({
    page,
  }) => {
    await page.goto("/de");

    const header = page.locator("header").first();
    const brand = header.getByRole("link", {name: "MHP Coaching"});
    const courses = header.getByRole("link", {name: "Ausbildungen"});
    const contact = header.getByRole("link", {name: "Kontakt"});
    const language = header.getByRole("button", {name: "Sprache wählen"});

    await expect(brand).toBeVisible();
    await expect(courses).toBeVisible();
    await expect(contact).toBeVisible();
    await expect(language).toBeVisible();

    const [headerBox, brandBox, coursesBox, contactBox, languageBox] =
      await Promise.all([
        header.boundingBox(),
        brand.boundingBox(),
        courses.boundingBox(),
        contact.boundingBox(),
        language.boundingBox(),
      ]);

    expect(headerBox?.height ?? 999).toBeLessThanOrEqual(72);

    const midY = (box: {y: number; height: number} | null) =>
      (box?.y ?? 0) + (box?.height ?? 0) / 2;

    const brandMid = midY(brandBox);
    expect(Math.abs(midY(coursesBox) - brandMid)).toBeLessThanOrEqual(8);
    expect(Math.abs(midY(contactBox) - brandMid)).toBeLessThanOrEqual(8);
    expect(Math.abs(midY(languageBox) - brandMid)).toBeLessThanOrEqual(8);
  });

  test("course price uses the functional sans-serif", async ({page}) => {
    await page.goto("/fr/formations/praticien-hypnose-omni");

    const price = page.getByText(/3’490/).first();
    await expect(price).toBeVisible();

    const fontFamily = await price.evaluate(
      (node) => getComputedStyle(node).fontFamily,
    );

    expect(fontFamily.toLowerCase()).not.toContain("cormorant");
    expect(fontFamily.toLowerCase()).toMatch(/source sans|sans-serif/);
  });

  test("language dropdown stays stable and thumb-sized", async ({page}) => {
    await page.goto("/fr");

    const switcher = page.getByRole("button", {name: "Choisir la langue"});
    const before = await switcher.boundingBox();
    expect(before?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(before?.width ?? 0).toBeGreaterThanOrEqual(44);

    await switcher.click();
    await page.getByRole("menuitemradio", {name: /Deutsch/}).click();
    await expect(page).toHaveURL(/\/de$/);
    const after = await page
      .getByRole("button", {name: "Sprache wählen"})
      .boundingBox();

    expect(after?.width).toBe(before?.width);
    expect(after?.x).toBe(before?.x);
  });

  test("course page keeps its booking action and footer reachable", async ({page}) => {
    await page.goto("/fr/formations/praticien-hypnose-omni");

    const booking = page.getByRole("link", {name: "S’inscrire"}).first();
    await expect(booking).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const copyright = page.getByText(/MHP Coaching/).last();
    const copyrightBox = await copyright.boundingBox();

    expect(copyrightBox).not.toBeNull();
    expect(copyrightBox!.y).toBeGreaterThanOrEqual(0);
  });
});
