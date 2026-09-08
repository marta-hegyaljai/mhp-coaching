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

  test("course booking bar stays reachable without covering the footer", async ({
    page,
  }) => {
    await page.goto("/fr/formations/praticien-hypnose-omni");

    const bar = page.getByRole("link", {name: "S’inscrire", exact: true});
    await expect(bar).toBeVisible();

    const barBox = await bar.boundingBox();
    expect(barBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const copyright = page.getByText(/MHP & Partners/).last();
    const copyrightBox = await copyright.boundingBox();
    const barBoxAfterScroll = await bar.boundingBox();

    expect(copyrightBox).not.toBeNull();
    expect(copyrightBox!.y + copyrightBox!.height).toBeLessThanOrEqual(
      (barBoxAfterScroll?.y ?? 0) + 1,
    );
  });
});
