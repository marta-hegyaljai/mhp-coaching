import {expect, test} from "@playwright/test";

const phone = {width: 390, height: 844};

test("desktop header separates sections, account actions and the call to action", async ({
  page,
}) => {
  await page.goto("/fr");
  const header = page.locator("header").first();

  await expect(header.getByRole("link", {name: "Formations"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Contact"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Connexion"})).toBeVisible();
  await expect(header.getByRole("link", {name: "S'inscrire"})).toBeHidden();
  await expect(header.getByRole("link", {name: "Réserver une place"})).toBeVisible();
  await expect(header.getByRole("button", {name: "Ouvrir le menu"})).toBeHidden();
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
  await expect(header.getByRole("link", {name: "Anmelden"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Registrieren"})).toBeHidden();

  await page.goto("/en");
  await header.getByRole("button", {name: "Open menu"}).click();
  await expect(header.getByRole("link", {name: "Courses"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Sign in"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Sign up"})).toBeHidden();
});

test("the sign-in page offers sign-up as the single guest auth action", async ({page}) => {
  await page.goto("/en/sign-in");
  const header = page.locator("header").first();

  await expect(header.getByRole("link", {name: "Sign up"})).toBeVisible();
  await expect(header.getByRole("link", {name: "Sign in"})).toBeHidden();
});
