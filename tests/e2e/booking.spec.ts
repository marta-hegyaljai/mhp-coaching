import {expect, test} from "@playwright/test";

test("course pages clearly say that dates are not available yet", async ({page}) => {
  await page.goto("/fr/formations/praticien-hypnose-omni");

  await expect(
    page.getByText("Aucune date n’est ouverte pour le moment.").first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {name: "S’inscrire à cette formation"}),
  ).toHaveCount(0);
  await expect(page.getByRole("link", {name: "Nous écrire"}).first()).toBeVisible();
});

test("the booking route remains unavailable until course dates are added", async ({
  page,
}) => {
  await page.goto("/fr/formations/praticien-hypnose-omni/inscription");

  await expect(
    page.getByText("Cette formation n’a pas de date ouverte pour le moment."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {name: "Continuer vers le paiement"}),
  ).toHaveCount(0);
});
