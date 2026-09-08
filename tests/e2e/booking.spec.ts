import {expect, test} from "@playwright/test";

test("choosing a date on the course page carries it into the form", async ({
  page,
}) => {
  await page.goto("/fr/formations/praticien-hypnose-omni");

  const dateLink = page
    .getByRole("link", {name: "Choisir cette date"})
    .first();
  const href = await dateLink.getAttribute("href");
  const dateId = new URL(href ?? "", "http://127.0.0.1:3000").searchParams.get(
    "date",
  );

  expect(dateId).toBeTruthy();
  await dateLink.click();

  const selected = page.getByRole("radio", {checked: true});
  await expect(selected).toHaveCount(1);
  await expect(selected).toHaveValue(dateId!);
});

test("an incomplete booking keeps the visitor's input and shows field errors", async ({
  page,
}) => {
  await page.goto("/fr/formations/praticien-hypnose-omni/inscription");

  await page.getByLabel("Prénom").fill("Ada");
  await page.getByRole("button", {name: "Continuer vers le paiement"}).click();

  await expect(page.getByText("Veuillez indiquer votre nom.")).toBeVisible();
  await expect(page.getByLabel("Prénom")).toHaveValue("Ada");
});

test("fake checkout can confirm a booking without trusting the success URL alone", async ({
  page,
}) => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL is required for booking e2e");

  await page.goto("/fr/formations/praticien-hypnose-omni/inscription");

  await page.getByLabel("Prénom").fill("Ada");
  await page.getByLabel("Nom", {exact: true}).fill("Lovelace");
  await page.getByLabel("E-mail").fill("ada@example.com");
  await page.getByLabel("Téléphone").fill("+41 21 311 25 81");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", {name: "Continuer vers le paiement"}).click();

  await expect(page).toHaveURL(/paiement-test/);
  await page.getByRole("button", {name: "Simuler un paiement réussi"}).click();
  await expect(page).toHaveURL(/inscription\/succes/);
  await expect(page.getByRole("heading", {level: 1})).toContainText("confirmée");
});

test("cancelled fake checkout never shows a paid confirmation", async ({page}) => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL is required for booking e2e");

  await page.goto("/fr/formations/praticien-hypnose-omni/inscription");

  await page.getByLabel("Prénom").fill("Grace");
  await page.getByLabel("Nom", {exact: true}).fill("Hopper");
  await page.getByLabel("E-mail").fill("grace@example.com");
  await page.getByLabel("Téléphone").fill("079 000 00 00");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", {name: "Continuer vers le paiement"}).click();

  await expect(page).toHaveURL(/paiement-test/);
  await page.getByRole("button", {name: "Simuler un paiement annulé"}).click();
  await expect(page).toHaveURL(/inscription\/annulee/);
          await expect(page.getByRole("heading", {level: 1})).toContainText("pas été mené");
});
