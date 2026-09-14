import {expect, test} from "@playwright/test";

const phonePaths = [
  "/fr",
  "/fr/formations",
  "/fr/inscription",
  "/fr/formations/praticien-hypnose-omni",
  "/fr/formations/praticien-hypnose-omni/inscription",
  "/fr/contact",
  "/fr/cas-cliniques",
  "/fr/perspectives",
  "/fr/a-propos",
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

  const phoneHeaderLocales = [
    {
      path: "/fr",
      openMenu: "Ouvrir le menu",
      cta: "Réserver",
      sections: ["Formations", "Cas cliniques", "Perspectives", "À propos", "Contact"],
    },
    {
      path: "/de",
      openMenu: "Menü öffnen",
      cta: "Buchen",
      sections: ["Ausbildungen", "Fallbibliothek", "Einblicke", "Über uns", "Kontakt"],
    },
    {
      path: "/en",
      openMenu: "Open menu",
      cta: "Book",
      sections: ["Courses", "Case Library", "Insights", "About", "Contact"],
    },
  ] as const;

  for (const {path, openMenu, cta, sections} of phoneHeaderLocales) {
    test(`phone header is a single navbar row on ${path}`, async ({page}) => {
      await page.goto(path);

      const header = page.locator("header").first();
      const brand = header.getByRole("link", {name: "MHP Coaching"});
      const menuButton = header.getByRole("button", {name: openMenu});
      const book = header.getByRole("link", {name: cta});

      await expect(brand).toBeVisible();
      await expect(book).toBeVisible();
      await expect(menuButton).toBeVisible();
      await expect(header.getByRole("link", {name: sections[0]})).toBeHidden();
      await expect(header.getByRole("button", {name: /langue|sprache|language/i})).toHaveCount(0);

      const [headerBox, brandBox, bookBox, menuBox] = await Promise.all([
        header.boundingBox(),
        brand.boundingBox(),
        book.boundingBox(),
        menuButton.boundingBox(),
      ]);

      expect(headerBox?.height ?? 999).toBeLessThanOrEqual(58);

      const midY = (box: {y: number; height: number} | null) =>
        (box?.y ?? 0) + (box?.height ?? 0) / 2;

      const brandMid = midY(brandBox);
      expect(Math.abs(midY(bookBox) - brandMid)).toBeLessThanOrEqual(4);
      expect(Math.abs(midY(menuBox) - brandMid)).toBeLessThanOrEqual(4);

      await menuButton.click();
      for (const label of sections) {
        await expect(header.getByRole("link", {name: label})).toBeVisible();
      }
    });
  }

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
