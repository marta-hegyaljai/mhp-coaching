import {expect, test} from "@playwright/test";

test("an undated course links to its booking and payment flow", async ({page}) => {
  await page.goto("/fr/formations/praticien-hypnose-omni");

  await expect(
    page.getByText(/La date sera confirmée prochainement/).first(),
  ).toBeVisible();
  await page
    .getByRole("link", {name: "S’inscrire à cette formation"})
    .first()
    .click();
  await expect(page).toHaveURL(/\/inscription$/);
});

test("an undated course can continue to secure payment", async ({
  page,
}) => {
  await page.goto("/fr/formations/praticien-hypnose-omni/inscription");

  await expect(
    page.getByText("Date à confirmer · Fribourg").first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {name: "Continuer vers le paiement"}),
  ).toBeVisible();
});
