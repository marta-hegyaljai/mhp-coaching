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

  test("language segments stay thumb-sized", async ({page}) => {
    await page.goto("/fr");

    const segments = page.getByRole("group", {name: "Choisir la langue"});
    const buttons = segments.getByRole("button");
    await expect(buttons).toHaveCount(3);

    for (const button of await buttons.all()) {
      const box = await button.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    }
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
