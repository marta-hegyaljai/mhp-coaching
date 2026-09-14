import {expect, test} from "@playwright/test";

const phone = {width: 390, height: 844};

test("desktop header separates sections, account actions and the call to action", async ({
  page,
}) => {
  await page.goto("/fr");
  const header = page.locator("header").first();

  const schoolMenu = header.getByRole("button", {name: "L’école"});

  await expect(header.getByRole("link", {name: "Formations"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Réserver une place"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Connexion"})).toBeVisible();
  await expect(header.getByRole("link", {name: "S'inscrire"})).toBeHidden();
  await expect(header.getByRole("button", {name: "Ouvrir le menu"})).toBeHidden();

  // Only the course list and the booking action carry text in the bar.
  await expect(schoolMenu).toBeVisible();
  await expect(schoolMenu).toHaveAttribute("aria-expanded", "false");
  await expect(header.getByRole("link", {name: "Cas cliniques"})).toBeHidden();
  await expect(header.getByRole("link", {name: "Contact"})).toBeHidden();
});

test("the school menu discloses the secondary destinations and closes again", async ({
  page,
}) => {
  await page.goto("/fr");
  const header = page.locator("header").first();
  const schoolMenu = header.getByRole("button", {name: "L’école"});

  await schoolMenu.click();
  await expect(schoolMenu).toHaveAttribute("aria-expanded", "true");
  await expect(header.getByRole("link", {name: /Cas cliniques/})).toBeVisible();
  await expect(header.getByRole("link", {name: /Perspectives/})).toBeVisible();
  await expect(header.getByRole("link", {name: /À propos/})).toBeVisible();
  await expect(header.getByRole("link", {name: /Contact/})).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(schoolMenu).toHaveAttribute("aria-expanded", "false");
  await expect(header.getByRole("link", {name: /Cas cliniques/})).toBeHidden();

  await schoolMenu.click();
  await header.getByRole("link", {name: /À propos/}).click();

  await expect(page).toHaveURL(/\/fr\/a-propos$/);
  await expect(schoolMenu).toHaveAttribute("aria-expanded", "false");
  // The group owns the open section, so the chip stays marked after arrival.
  await expect(schoolMenu).toHaveAttribute("aria-current", "true");
});

test("the phone header keeps the call to action outside the menu", async ({page}) => {
  await page.setViewportSize(phone);
  await page.goto("/fr");
  const header = page.locator("header").first();
  const menuButton = header.getByRole("button", {name: "Ouvrir le menu"});

  await expect(menuButton).toBeVisible();
  await expect(header.getByRole("link", {name: "Réserver"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Formations"})).toBeHidden();

  await menuButton.click();
  await expect(header.getByRole("link", {name: "Formations"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Cas cliniques"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Perspectives"})).toBeVisible();
  await expect(header.getByRole("link", {name: "À propos"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Contact"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Connexion"})).toBeVisible();
  await expect(header.getByRole("link", {name: "S'inscrire"})).toBeHidden();
  // The booking action must never be buried inside the menu.
  await expect(header.getByRole("link", {name: "Réserver"})).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(header.getByRole("button", {name: "Ouvrir le menu"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Contact"})).toBeHidden();
});

test("choosing a section from the phone menu navigates and closes the sheet", async ({
  page,
}) => {
  await page.setViewportSize(phone);
  await page.goto("/fr");
  const header = page.locator("header").first();

  await header.getByRole("button", {name: "Ouvrir le menu"}).click();
  await header.getByRole("link", {name: "Formations"}).click();

  await expect(page).toHaveURL(/\/fr\/formations$/);
  await expect(header.getByRole("button", {name: "Ouvrir le menu"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Contact"})).toBeHidden();
  await expect(page.getByRole("heading", {level: 1})).toHaveText("Formations en hypnose");
});

test("phone menu labels stay localized in DE and EN", async ({page}) => {
  await page.setViewportSize(phone);
  const header = page.locator("header").first();

  await page.goto("/de");
  await header.getByRole("button", {name: "Menü öffnen"}).click();
  await expect(header.getByRole("link", {name: "Ausbildungen"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Fallbibliothek"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Einblicke"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Über uns"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Anmelden"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Registrieren"})).toBeHidden();

  await page.goto("/en");
  await expect(header.getByRole("button", {name: "Open menu"})).toBeVisible();
  await header.getByRole("button", {name: "Open menu"}).click();
  await expect(header.getByRole("link", {name: "Courses"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Case Library"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Insights"})).toBeVisible();
  await expect(header.getByRole("link", {name: "About"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Sign in"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Sign up"})).toBeHidden();
});

test("case library and insights preview the forthcoming work", async ({page}) => {
  await page.goto("/en/case-library");
  await expect(page).toHaveURL(/\/en\/case-library$/);
  await expect(page.getByRole("heading", {level: 1})).toHaveText("Case Library");
  await expect(page.getByText("Coming soon").first()).toBeVisible();
  await expect(page.getByRole("heading", {name: "Teaching cases"})).toBeVisible();
  await expect(
    page.locator("header").first().getByRole("button", {name: "The school"}),
  ).toHaveAttribute("aria-current", "true");

  await page.goto("/fr/perspectives");
  await expect(page.getByRole("heading", {level: 1})).toHaveText("Perspectives");
  await expect(page.getByText("Prochainement").first()).toBeVisible();
  await expect(page.getByText(/hypno-neuro-imagination/).first()).toBeVisible();

  await page.goto("/de/fallbibliothek");
  await expect(page.getByRole("heading", {level: 1})).toHaveText("Fallbibliothek");
  await expect(page.getByText("Demnächst").first()).toBeVisible();
});

test("the about page publishes the founder portrait, quote and recognitions", async ({page}) => {
  await page.goto("/fr/a-propos");
  await expect(page.getByRole("heading", {level: 1})).toHaveText("Marta Hegyaljai Python");
  await expect(
    page.getByRole("img", {
      name: "Marta Hegyaljai Python, fondatrice de MHP Coaching, formatrice en hypnose",
    }),
  ).toBeVisible();
  await expect(page.getByText(/force motrice fondamentale/)).toBeVisible();
  await expect(page.getByText(/Promoting Hypnotism Award/)).toBeVisible();

  await page.goto("/en/about");
  await expect(page.getByRole("heading", {level: 1})).toHaveText("Marta Hegyaljai Python");
  await expect(page.getByText(/Spinoza/)).toBeVisible();

  await page.goto("/de/ueber-uns");
  await expect(page.getByRole("heading", {name: "Eine anerkannte Expertise über die Schule hinaus"})).toBeVisible();
});

test("the sign-in page offers sign-up as the single guest auth action", async ({page}) => {
  await page.goto("/en/sign-in");
  const header = page.locator("header").first();

  await expect(header.getByRole("link", {name: "Sign up"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Sign in"})).toBeHidden();
});
