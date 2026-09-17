import {expect, test} from "@playwright/test";

const locales = [
  {
    locale: "fr",
    heading: "L’hypnose simple, moderne et efficace depuis 1979.",
    whyHeading: "Pourquoi choisir mhp | coaching",
    coursesPath: "/fr/formations",
    coursesHeading: "Formations en hypnose",
  },
  {
    locale: "de",
    heading: "Einfache, moderne und wirksame Hypnose seit 1979.",
    whyHeading: "Warum mhp | coaching",
    coursesPath: "/de/ausbildungen",
    coursesHeading: "Hypnose-Ausbildungen",
  },
  {
    locale: "en",
    heading: "Simple, modern and effective hypnosis since 1979.",
    whyHeading: "Why choose mhp | coaching",
    coursesPath: "/en/courses",
    coursesHeading: "Hypnosis courses",
  },
] as const;

for (const {locale, heading, whyHeading, coursesPath, coursesHeading} of locales) {
  test(`${locale} homepage renders its translation and SEO tags`, async ({page}) => {
    await page.goto(`/${locale}`);

    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByRole("heading", {level: 1})).toHaveText(heading);
    await expect(page.locator("#pourquoi-choisir").getByRole("heading", {level: 2})).toHaveText(
      whyHeading,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`/${locale}$`),
    );
    await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute(
      "href",
      /\/fr$/,
    );
    const statue = page.getByRole("img", {
      name: /sculpture|skulptur|statue|obelisk|obélisque/i,
    });
    await expect(statue).toBeVisible();
    const statueBox = await statue.boundingBox();
    expect(statueBox?.width ?? 0).toBeGreaterThan(280);

    const footer = page.getByRole("contentinfo");
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

test("homepage banner is full-bleed with copy beside the artwork on desktop", async ({
  page,
}) => {
  await page.setViewportSize({width: 1280, height: 800});
  await page.goto("/fr");

  const hero = page.locator("#home-hero");
  const heading = page.getByRole("heading", {level: 1});
  const artwork = page.getByRole("img", {name: /obélisque|obelisk|sculpture/i});
  const [heroBox, headingBox, artworkBox] = await Promise.all([
    hero.boundingBox(),
    heading.boundingBox(),
    artwork.boundingBox(),
  ]);

  expect(heroBox?.x).toBe(0);
  expect(Math.round(heroBox?.width ?? 0)).toBe(1280);
  expect(headingBox?.x ?? 999).toBeLessThan(artworkBox?.x ?? 0);
  expect(artworkBox?.x ?? 0).toBeGreaterThan(500);
  await expect
    .poll(async () => heading.evaluate((node) => getComputedStyle(node).color))
    .toBe("rgb(255, 255, 255)");
  await expect(page.getByText("Obelisk — Jan Hegy")).toBeVisible();
});

test("homepage banner stacks a light copy panel above the artwork on a phone", async ({
  page,
}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto("/fr");

  const hero = page.locator("#home-hero");
  const heading = page.getByRole("heading", {level: 1});
  const artwork = page.getByRole("img", {name: /obélisque|obelisk|sculpture/i});
  const [heroBox, headingBox, artworkBox] = await Promise.all([
    hero.boundingBox(),
    heading.boundingBox(),
    artwork.boundingBox(),
  ]);

  expect(heroBox?.x).toBe(0);
  expect(Math.round(heroBox?.width ?? 0)).toBe(390);
  expect(artworkBox?.y ?? 999).toBeLessThanOrEqual(headingBox?.y ?? 0);
  expect(artworkBox?.height ?? 0).toBeGreaterThan(headingBox?.height ?? 999);
  await expect
    .poll(async () => heading.evaluate((node) => getComputedStyle(node).color))
    .toBe("rgb(9, 9, 9)");
  const overlayIsLight = await heading.evaluate((node) => {
    const background = getComputedStyle(node.parentElement!).backgroundColor;
    const oklab = background.match(/oklab\(([0-9.]+)/);
    if (oklab) {
      return Number(oklab[1]) > 0.85;
    }
    const rgb = background.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!rgb) {
      return false;
    }
    return Number(rgb[1]) > 200 && Number(rgb[2]) > 200 && Number(rgb[3]) > 200;
  });
  expect(overlayIsLight).toBe(true);
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
  "/fr/mentions-legales/cgu",
  "/fr/mentions-legales/conditions",
  "/fr/mentions-legales/confidentialite",
  "/fr/mentions-legales/droits-auteur",
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
  expect(blob).toContain("MHP Coaching");
  expect(blob).not.toMatch(/admin@mhp|21 311 25 81|mhp-hypnose|Partners Sàrl|CHE-459/i);
});

test("legal pages publish Swiss identity, TWINT terms and no retired brand", async ({
  page,
}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto("/fr/mentions-legales");
  await expect(page.getByRole("heading", {level: 1})).toHaveText("Mentions légales");
  await expect(page.getByText("MHP Coaching").first()).toBeVisible();
  await expect(page.getByText("Chemin de la Fenetta 42").first()).toBeVisible();
  await expect(page.getByText("1752 Villars-sur-Glâne").first()).toBeVisible();
  await expect(page.getByText("Marta Hegyaljai Python").first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText(
    /mhp-hypnose|Partners Sàrl|CHE-459/i,
  );

  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", {name: "Mentions légales"})).toBeVisible();
  await expect(
    footer.getByRole("link", {name: /Conditions d.utilisation/}),
  ).toBeVisible();
  await expect(
    footer.getByRole("link", {name: /Conditions d.inscription/}),
  ).toBeVisible();
  await expect(
    footer.getByRole("link", {name: "Protection des données"}),
  ).toBeVisible();
  await expect(footer.getByRole("link", {name: /Droits d.auteur/})).toBeVisible();

  await page.goto("/fr/mentions-legales/conditions");
  await expect(page.getByRole("heading", {level: 1})).toHaveText(
    "Conditions générales d’inscription",
  );
  await expect(page.getByText(/TWINT/).first()).toBeVisible();
  await expect(page.getByText(/Visa/).first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/mhp-hypnose/i);

  await page.goto("/de/rechtliches/impressum");
  await expect(page.getByRole("heading", {level: 1})).toHaveText("Impressum");
  await expect(page.getByText("MHP Coaching").first()).toBeVisible();
  await expect(page.getByText("Villars-sur-Glâne").first()).toBeVisible();

  await page.goto("/en/legal/privacy");
  await expect(page.getByRole("heading", {level: 1})).toHaveText("Privacy notice");
  await expect(page.getByText(/GDPR|FADP/).first()).toBeVisible();
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

test("header exposes sign-up and marks the current page", async ({page}) => {
  await page.goto("/en");
  const header = page.locator("header").first();
  await expect(header.getByRole("link", {name: "Sign in"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Sign up"})).toBeHidden();

  await header.getByRole("link", {name: "Courses"}).click();
  await expect(page).toHaveURL(/\/en\/courses$/);
  await expect(header.getByRole("link", {name: "Courses"})).toHaveAttribute("aria-current", "page");
  await expect(header.getByRole("button", {name: "The school"})).not.toHaveAttribute("aria-current");
  await expect(header.getByRole("link", {name: "Sign in"})).not.toHaveAttribute("aria-current");

  await page.goto("/fr");
  await expect(page.locator("header").first().getByRole("link", {name: "Connexion"})).toBeVisible();
  await expect(page.locator("header").first().getByRole("link", {name: "S'inscrire"})).toBeHidden();
  await page.goto("/de");
  await expect(page.locator("header").first().getByRole("link", {name: "Anmelden"})).toBeVisible();
  await expect(page.locator("header").first().getByRole("link", {name: "Registrieren"})).toBeHidden();
});

test("homepage why-choose blocks and founder quote sit above the footer", async ({
  page,
}) => {
  await page.goto("/fr");

  const section = page.locator("#pourquoi-choisir");
  const footer = page.getByRole("contentinfo");

  await expect(section.getByRole("heading", {level: 2})).toHaveText(
    "Pourquoi choisir mhp | coaching",
  );
  // Seven claim blocks; the eighth tile is the contact call to action.
  await expect(section.locator("li[id^='diff-']")).toHaveCount(7);
  await expect(
    section.getByRole("heading", {name: "Un curriculum documenté et public"}),
  ).toBeVisible();
  await expect(section.locator("#diff-curriculum")).toBeVisible();
  await expect(section.getByRole("link", {name: "Poser une question"})).toBeVisible();

  await expect(page.getByText(/soutenir l’individu/)).toBeVisible();
  await expect(page.getByRole("link", {name: "Lire tous les avis"})).toBeVisible();

  await expect
    .poll(async () => section.evaluate((node) => getComputedStyle(node).backgroundColor))
    .toBe("rgba(0, 0, 0, 0)");

  const [sectionBox, footerBox] = await Promise.all([
    section.boundingBox(),
    footer.boundingBox(),
  ]);
  expect((sectionBox?.y ?? 0) + (sectionBox?.height ?? 0)).toBeLessThanOrEqual(
    footerBox?.y ?? 0,
  );
});

test("foundation course presents NGH and APSH as possibilities", async ({page}) => {
  await page.goto("/fr/formations/praticien-hypnose-omni");

  await page.locator("summary").filter({hasText: "Diplôme NGH"}).click();
  await expect(
    page.getByText(
      "Vous avez la possibilité de recevoir le diplôme de la National Guild of Hypnotists (NGH).",
    ),
  ).toBeVisible();

  await page.locator("summary").filter({hasText: "Association professionnelle"}).click();
  await expect(
    page.getByText(
      "Possibilité de faire partie de l’Association Professionnelle Suisse pour l’Hypnose Thérapeutique (APSH).",
    ),
  ).toBeVisible();
});

test("equivalent localized course slugs remain reachable", async ({page}) => {
  await page.goto("/fr/formations/praticien-hypnose-omni");
  await expect(page.getByRole("heading", {level: 1})).toContainText("Praticien");

  await page.goto("/en/courses/omni-hypnosis-practitioner");
  await expect(page).toHaveURL(/\/en\/courses\/omni-hypnosis-practitioner$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
