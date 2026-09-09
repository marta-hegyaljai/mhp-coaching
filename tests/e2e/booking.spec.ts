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

test("course sidebar lists upcoming sessions and books a chosen date", async ({
  page,
}) => {
  await page.goto("/fr/formations/praticien-hypnose-omni");

  const card = page.getByRole("complementary");
  await expect(card.getByText("Prochaines sessions")).toBeVisible();
  await expect(card.getByRole("link", {name: "10 – 20 septembre 2026"})).toBeVisible();
  await expect(card.getByRole("link", {name: "8 – 18 octobre 2026"})).toBeVisible();
  await expect(card.getByRole("link", {name: "12 – 22 novembre 2026"})).toBeVisible();

  await card.getByRole("link", {name: "8 – 18 octobre 2026"}).click();
  await expect(page).toHaveURL(/date=omni-practitioner-2026-10-08/);
  await expect(page.getByRole("radio", {name: /octobre 2026/})).toBeChecked();
});

test("DE and EN course pages list upcoming sessions in the booking card", async ({
  page,
}) => {
  await page.goto("/de/ausbildungen/omni-hypnose-praktiker");
  await expect(
    page.getByRole("complementary").getByText("Nächste Durchführungen"),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary").getByRole("link", {name: "10 – 20. September 2026"}),
  ).toBeVisible();

  await page.goto("/en/courses/omni-hypnosis-practitioner");
  await expect(
    page.getByRole("complementary").getByText("Upcoming sessions"),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary").getByRole("link", {name: "10 – 20 September 2026"}),
  ).toBeVisible();
});

test("a single-date course keeps the singular next-session label", async ({
  page,
}) => {
  await page.goto("/fr/formations/enfants-hypnose");
  const card = page.getByRole("complementary");
  await expect(card.getByText("Prochaine session", {exact: true})).toBeVisible();
  await expect(card.getByText("Prochaines sessions")).toHaveCount(0);
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

test("empty checkout actions list the missing required fields", async ({page}) => {
  await page.goto("/fr/formations/praticien-hypnose-omni/inscription");

  await page.getByRole("button", {name: "Continuer vers le paiement"}).click();

  await expect(page.getByRole("alert").first()).toContainText(
    "Champs obligatoires manquants",
  );
  await expect(page.getByText("Veuillez indiquer votre prénom.").first()).toBeVisible();
  await expect(page.getByText("Confidentialité et conditions").first()).toBeVisible();
  await page.getByRole("alert").getByRole("button", {name: "Prénom"}).click();
  await expect(page.getByRole("textbox", {name: "Prénom", exact: true})).toBeFocused();

  await page.getByRole("button", {name: "Je préfère un autre moyen de paiement"}).click();
  await expect(page.getByRole("alert").first()).toContainText(
    "Champs obligatoires manquants",
  );
  await expect(page).toHaveURL(/\/inscription$/);
});

test("another payment method opens the cancelled-payment contact form with the course", async ({
  page,
}) => {
  await page.goto("/fr/formations/praticien-hypnose-omni/inscription");
  await page.locator("label").filter({hasText: "10 – 20 septembre 2026"}).click();
  await page.getByRole("textbox", {name: "Prénom", exact: true}).fill("Ada");
  await page.getByRole("textbox", {name: "Nom", exact: true}).fill("Lovelace");
  await page
    .getByRole("textbox", {name: "E-mail"})
    .fill(`ada-other-${Date.now()}@example.com`);
  await page.getByLabel("Téléphone").fill("+41 79 451 44 92");
  await page.getByLabel("Adresse").fill("Chemin de la Fenetta 42");
  await page.getByLabel("Code postal").fill("1752");
  await page.getByLabel("Ville").fill("Villars-sur-Glâne");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", {name: "Je préfère un autre moyen de paiement"}).click();

  await expect(page).toHaveURL(/\/inscription\/annulee\?/);
  await expect(page).toHaveURL(/bookingId=/);
  await expect(page).toHaveURL(/source=other/);
  await expect(page.getByRole("heading", {level: 1})).toHaveText("Payer autrement");
  await expect(page.getByText("Praticien·ne en Hypnose OMNI®").first()).toBeVisible();
  await expect(page.getByText(/septembre 2026/).first()).toBeVisible();
  await expect(page.getByRole("textbox", {name: "Message"})).toBeVisible();
});

test("quick booking calendar is reachable from the homepage shortcut", async ({page}) => {
  await page.goto("/fr");
  await page.getByRole("link", {name: "Réserver une place"}).first().click();
  await expect(page).toHaveURL(/\/fr\/inscription$/);
  await expect(page.getByRole("heading", {level: 1})).toHaveText("Réserver une place");
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(page.getByRole("button", {name: /OMNI/}).first()).toBeVisible();
});
