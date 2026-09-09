import {expect, test} from "@playwright/test";

test("a dated course shows exact sessions and a date picker on booking", async ({page}) => {
  await page.goto("/fr/formations/praticien-hypnose-omni");

  await expect(page.getByText(/10 – 20 septembre 2026/).first()).toBeVisible();
  await page
    .getByRole("link", {name: "S’inscrire à cette formation"})
    .first()
    .click();
  await expect(page).toHaveURL(/\/inscription$/);
  await expect(page.getByRole("radio", {name: /septembre 2026/}).first()).toBeVisible();
  await expect(page.getByLabel("Adresse")).toBeVisible();
});

test("an undated course collects a waiting-list request instead of payment", async ({page}) => {
  await page.goto("/fr/formations/hypnose-medicale-techniques-base/inscription");

  await expect(page.getByRole("heading", {name: "Rejoindre la liste d’attente"})).toBeVisible();
  await expect(page.getByRole("button", {name: "Continuer vers le paiement"})).toHaveCount(0);
  await page.getByRole("textbox", {name: "Prénom", exact: true}).fill("Ada");
  await page.getByRole("textbox", {name: "Nom", exact: true}).fill("Lovelace");
  await page.getByRole("textbox", {name: "E-mail", exact: true}).fill(`ada-${Date.now()}@example.com`);
  await page.getByLabel("Téléphone").fill("+41 79 451 44 92");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", {name: "Rejoindre la liste d’attente"}).click();
  await expect(page.getByRole("status")).toContainText("liste d’attente");
});

test("quick booking calendar is reachable from the homepage shortcut", async ({page}) => {
  await page.goto("/fr");
  await page.getByRole("link", {name: "Réserver une place"}).first().click();
  await expect(page).toHaveURL(/\/fr\/inscription$/);
  await expect(page.getByRole("heading", {level: 1})).toHaveText("Réserver une place");
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(page.getByRole("button", {name: /OMNI/}).first()).toBeVisible();
});
