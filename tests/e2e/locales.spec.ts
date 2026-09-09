import {expect, test} from "@playwright/test";

const locales = [
  {
    locale: "fr",
    heading: "La formation en hypnose elmanienne, avec calme et précision.",
    coursesPath: "/fr/formations",
    coursesHeading: "Formations en hypnose",
  },
  {
    locale: "de",
    heading: "Ausbildung in elmanischer Hypnose, ruhig und präzise.",
    coursesPath: "/de/ausbildungen",
    coursesHeading: "Hypnose-Ausbildungen",
  },
  {
    locale: "en",
    heading: "Elmanian hypnosis training, taught with calm precision.",
    coursesPath: "/en/courses",
    coursesHeading: "Hypnosis courses",
  },
] as const;

for (const {locale, heading, coursesPath, coursesHeading} of locales) {
  test(`${locale} homepage renders its translation and SEO tags`, async ({page}) => {
    await page.goto(`/${locale}`);

    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByRole("heading", {level: 1})).toHaveText(heading);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`/${locale}$`),
    );
    await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute(
      "href",
      /\/fr$/,
    );
    const statue = page.getByRole("img", {
      name: /sculpture|skulptur|statue/i,
    });
    await expect(statue).toBeVisible();
    const statueBox = await statue.boundingBox();
    expect(statueBox?.width ?? 0).toBeGreaterThan(280);

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect
      .poll(async () => footer.evaluate((node) => getComputedStyle(node).backgroundColor))
      .toBe("rgb(9, 9, 9)");
  });

  test(`${locale} course catalogue is reachable on a localized URL`, async ({page}) => {
    await page.goto(coursesPath);
    await expect(page.getByRole("heading", {level: 1})).toHaveText(coursesHeading);
    await expect(page.getByRole("heading", {level: 2}).first()).toBeVisible();
    await expect(page.locator("a:has(> article)").first()).toBeVisible();
    await expect(
      page.getByRole("img", {name: /Marta Hegyaljai Python/}).locator("visible=true"),
    ).toBeVisible();
  });
}

test("course catalogue keeps the instructor portrait without hiding the courses", async ({
  page,
}) => {
  await page.setViewportSize({width: 1280, height: 900});
  await page.goto("/fr/formations");

  const photo = page.getByRole("img", {name: /Marta Hegyaljai Python/}).last();
  const firstCard = page.locator("a:has(> article)").first();
  const [photoBox, cardBox] = await Promise.all([
    photo.boundingBox(),
    firstCard.boundingBox(),
  ]);

  expect(photoBox?.height ?? 0).toBeGreaterThan(200);
  expect(photoBox?.height ?? 999).toBeLessThan(480);
  expect(cardBox?.y ?? 999).toBeLessThan(900);

  await page.setViewportSize({width: 390, height: 844});
  await page.goto("/fr/formations");
  const phonePhoto = await page
    .getByRole("img", {name: /Marta Hegyaljai Python/})
    .first()
    .boundingBox();
  const phoneCard = await page.locator("a:has(> article)").first().boundingBox();

  expect(phonePhoto?.height ?? 999).toBeLessThan(280);
  expect(phoneCard?.y ?? 999).toBeLessThan(844);
});

test("root redirects to French and locale URLs still work without the picker", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/fr$/);
  await expect(page.getByRole("button", {name: /langue|sprache|language/i})).toHaveCount(0);

  await page.goto("/de");
  await expect(page).toHaveURL(/\/de$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
});

const publicContactSurfaces = [
  "/fr/contact",
  "/de/kontakt",
  "/en/contact",
  "/fr/mentions-legales",
  "/de/rechtliches/impressum",
  "/en/legal/imprint",
] as const;

for (const path of publicContactSurfaces) {
  test(`${path} shows the MHP Coaching email and phone`, async ({page}) => {
    await page.goto(path);

    const email = page.getByRole("link", {name: "contact@mhp-coaching.ch"});
    const phone = page.getByRole("link", {name: "+41 79 451 44 92"});

    await expect(email.first()).toBeVisible();
    await expect(email.first()).toHaveAttribute(
      "href",
      "mailto:contact@mhp-coaching.ch",
    );
    await expect(phone.first()).toBeVisible();
    await expect(phone.first()).toHaveAttribute("href", "tel:+41794514492");
    await expect(
      page.getByRole("contentinfo").getByRole("link", {name: "contact@mhp-coaching.ch"}),
    ).toBeVisible();
    await expect(
      page.getByRole("contentinfo").getByRole("link", {name: "+41 79 451 44 92"}),
    ).toBeVisible();
    await expect(page.getByText(/admin@mhp|21 311 25 81/i)).toHaveCount(0);
  });
}

test("homepage structured data uses the MHP Coaching email and phone", async ({
  page,
}) => {
  await page.goto("/fr");
  const jsonLd = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  const blob = jsonLd.join("\n");

  expect(blob).toContain("contact@mhp-coaching.ch");
  expect(blob).toContain("+41 79 451 44 92");
  expect(blob).not.toMatch(/admin@mhp|21 311 25 81/i);
});

test("serves the mhp-coaching.ch favicon", async ({page, request}) => {
  const favicon = await request.get("/favicon.ico");
  expect(favicon.status()).toBe(200);
  expect(favicon.headers()["content-type"]).toMatch(/icon|octet-stream|png/i);
  expect((await favicon.body()).length).toBeGreaterThan(100);

  await page.goto("/fr");
  const icon = page.locator('link[rel="icon"]').first();
  await expect(icon).toHaveAttribute("href", /icon/i);
});

test("equivalent localized course slugs remain reachable", async ({page}) => {
  await page.goto("/fr/formations/praticien-hypnose-omni");
  await expect(page.getByRole("heading", {level: 1})).toContainText("Praticien");

  await page.goto("/en/courses/omni-hypnosis-practitioner");
  await expect(page).toHaveURL(/\/en\/courses\/omni-hypnosis-practitioner$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
