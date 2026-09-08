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
  });

  test(`${locale} course catalogue is reachable on a localized URL`, async ({page}) => {
    await page.goto(coursesPath);
    await expect(page.getByRole("heading", {level: 1})).toHaveText(coursesHeading);
    await expect(page.getByRole("heading", {level: 2}).first()).toBeVisible();
    await expect(page.locator("a:has(> article)").first()).toBeVisible();
  });
}

test("root redirects to French and the language switcher preserves the page", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/fr$/);

  await page.getByRole("button", {name: "Choisir la langue"}).click();
  await page.getByRole("menuitemradio", {name: /Deutsch/}).click();
  await expect(page).toHaveURL(/\/de$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
});

test("contact details use the MHP Coaching email and phone", async ({page}) => {
  await page.goto("/fr/contact");
  const email = page.getByRole("link", {name: "contact@mhp-coaching.ch"});
  const phone = page.getByRole("link", {name: "+41 79 451 44 92"});
  await expect(email).toBeVisible();
  await expect(email).toHaveAttribute("href", "mailto:contact@mhp-coaching.ch");
  await expect(phone).toBeVisible();
  await expect(phone).toHaveAttribute("href", "tel:+41794514492");
  await expect(page.getByText(/mhp-hypnose/i)).toHaveCount(0);
});

test("language switcher maps a course to the equivalent localized slug", async ({
  page,
}) => {
  await page.goto("/fr/formations/praticien-hypnose-omni");
  await expect(page.getByRole("heading", {level: 1})).toContainText("Praticien");

  await page.getByRole("button", {name: "Choisir la langue"}).click();
  await page.getByRole("menuitemradio", {name: /English/}).click();
  await expect(page).toHaveURL(/\/en\/courses\/omni-hypnosis-practitioner$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
