import {expect, type Page, test} from "@playwright/test";

async function chooseDateOfBirth(page: Page) {
  await page.getByRole("button", {name: "Date de naissance"}).click();
  const dialog = page.getByRole("dialog", {name: "Calendrier"});
  await dialog.getByLabel("Année").selectOption("1990");
  await dialog.getByLabel("Mois", {exact: true}).selectOption("4");
  await dialog.getByRole("button", {name: /15 mai 1990/i}).click();
}

test("Café Supervision registers a visio evening without Stripe", async ({
  page,
}) => {
  await page.goto("/fr/formations/cafe-supervision");

  await expect(page.getByRole("heading", {level: 1, name: "Café Supervision"})).toBeVisible();
  await expect(page.getByText("Formation continue").first()).toBeVisible();
  await expect(page.getByText("Visioconférence").first()).toBeVisible();
  await expect(page.getByText("Gratuit").first()).toBeVisible();
  await expect(page.getByRole("heading", {name: "Le format"})).toBeVisible();

  await page.getByRole("link", {name: "S’inscrire à cette session"}).first().click();
  await expect(page).toHaveURL(/\/inscription/);
  await expect(page.getByRole("heading", {level: 1, name: "Confirmer votre inscription"})).toBeVisible();
  await expect(page.getByText(/aucun paiement n’est demandé/i)).toBeVisible();
  await expect(page.getByRole("button", {name: "Confirmer l’inscription"})).toBeVisible();
  await expect(page.getByText(/TWINT/)).toHaveCount(0);
  await expect(page.getByRole("button", {name: /Continuer vers le paiement/})).toHaveCount(0);

  await page.locator("label").filter({has: page.getByRole("radio")}).first().click();
  await page.getByRole("textbox", {name: "Prénom", exact: true}).fill("Léa");
  await page.getByRole("textbox", {name: "Nom", exact: true}).fill("Supervision");
  await chooseDateOfBirth(page);
  await page
    .getByRole("textbox", {name: "E-mail"})
    .fill(`lea.supervision.${Date.now()}@example.com`);
  await page.getByLabel("Téléphone").fill("+41 79 451 44 92");
  await page.getByLabel("Adresse").fill("Chemin de la Fenetta 42");
  await page.getByLabel("Code postal").fill("1752");
  await page.getByLabel("Ville").fill("Villars-sur-Glâne");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", {name: "Confirmer l’inscription"}).click();

  await expect(page).toHaveURL(/\/inscription\/confirmee\?bookingId=/);
  await expect(page.getByRole("heading", {level: 1})).toContainText("confirmée");
  await expect(page.getByText("Confirmé")).toBeVisible();
  await expect(page.getByText("Café Supervision").first()).toBeVisible();
  await expect(page.getByText("Visioconférence")).toBeVisible();
  await expect(page.getByText("Gratuit")).toBeVisible();
});

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
  await expect(page.getByRole("button", {name: "Date de naissance"})).toBeVisible();
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

test("a dated course offers a quieter waitlist when no published date fits", async ({
  page,
}) => {
  await page.goto("/fr/formations/praticien-hypnose-omni");

  const card = page.getByRole("complementary");
  await expect(card.getByRole("link", {name: "S’inscrire à cette formation"})).toBeVisible();
  await expect(card.getByText("Pas de date qui vous convienne ?")).toBeVisible();

  await card.getByRole("link", {name: "Rejoindre la liste d’attente"}).click();
  await expect(page).toHaveURL(/waitlist=1/);
  await expect(page.getByRole("heading", {name: "Rejoindre la liste d’attente"})).toBeVisible();
  await expect(page.getByText(/Aucune des dates publiées ne vous convient/)).toBeVisible();
  await expect(page.getByRole("button", {name: "Continuer vers le paiement"})).toHaveCount(0);
});

test("DE and EN dated course pages keep waitlist as a secondary action", async ({
  page,
}) => {
  await page.goto("/de/ausbildungen/omni-hypnose-praktiker");
  await expect(
    page.getByRole("complementary").getByText("Kein passender Termin?"),
  ).toBeVisible();
  await page
    .getByRole("complementary")
    .getByRole("link", {name: "Auf die Warteliste"})
    .click();
  await expect(page).toHaveURL(/waitlist=1/);
  await expect(page.getByText(/Keiner der veröffentlichten Termine passt/)).toBeVisible();

  await page.goto("/en/courses/omni-hypnosis-practitioner");
  await expect(
    page.getByRole("complementary").getByText("No suitable date?"),
  ).toBeVisible();
  await page
    .getByRole("complementary")
    .getByRole("link", {name: "Join the waiting list"})
    .click();
  await expect(page).toHaveURL(/waitlist=1/);
  await expect(page.getByText(/None of the published dates work for you/)).toBeVisible();
});

test("an undated course keeps waitlist as the only course-page action", async ({
  page,
}) => {
  await page.goto("/fr/formations/maitre-praticien-hypnose-elmanienne");

  const card = page.getByRole("complementary");
  await expect(card.getByRole("link", {name: "Rejoindre la liste d’attente"})).toBeVisible();
  await expect(card.getByRole("link", {name: "S’inscrire à cette formation"})).toHaveCount(0);
  await expect(card.getByText("Pas de date qui vous convienne ?")).toHaveCount(0);
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
  await expect(page.getByText("Veuillez indiquer votre date de naissance.").first()).toBeVisible();
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
  await page.locator("label").filter({has: page.getByRole("radio")}).first().click();
  await page.getByRole("textbox", {name: "Prénom", exact: true}).fill("Ada");
  await page.getByRole("textbox", {name: "Nom", exact: true}).fill("Lovelace");
  await chooseDateOfBirth(page);
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
  await expect(page.getByText(/20(26|27)/).first()).toBeVisible();
  await expect(page.getByRole("textbox", {name: "Message"})).toBeVisible();
});

test("the booking shortcut opens the catalogue in calendar view", async ({page}) => {
  await page.goto("/fr");
  await page.getByRole("link", {name: "Réserver une place"}).first().click();
  await expect(page).toHaveURL(/\/fr\/formations\?view=calendar/);
  await expect(page.getByRole("heading", {level: 1})).toHaveText("Formations en hypnose");
  await expect(page.getByRole("button", {name: "Calendrier", pressed: true})).toBeVisible();
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(page.getByRole("button", {name: /OMNI/}).first()).toBeVisible();
});

test("a course page offers a free call and a written question", async ({page}) => {
  await page.goto("/fr/formations/praticien-hypnose-omni");

  const card = page.getByRole("complementary");
  await expect(card.getByText("Une question avant de vous inscrire ?")).toBeVisible();
  await card.getByRole("link", {name: "Choisir un horaire"}).click();
  await expect(page).toHaveURL(/\/conseil/);
  await expect(page.getByRole("heading", {level: 1})).toHaveText(
    "Un appel de quinze minutes, offert",
  );
  await expect(page.getByRole("link", {name: "Appel"})).toHaveAttribute(
    "aria-current",
    "page",
  );

  await page.getByRole("link", {name: "Écrire"}).click();
  await expect(page).toHaveURL(/mode=write/);
  await expect(page.getByLabel("Votre question")).toBeVisible();
  await expect(page.getByRole("button", {name: "Envoyer le message"})).toBeVisible();
});

test("the booking page keeps the advice offer beside enrolment", async ({page}) => {
  await page.goto("/fr/formations/praticien-hypnose-omni/inscription");

  await expect(page.getByRole("heading", {name: "Réserver votre place"})).toBeVisible();
  await expect(page.getByText("Une question avant de vous inscrire ?")).toBeVisible();
  await page.getByRole("link", {name: "Envoyer un message"}).click();
  await expect(page).toHaveURL(/conseil\?mode=write/);
});

test("a visitor can reserve a free fifteen-minute call", async ({page}) => {
  const stamp = Date.now();
  await page.goto("/fr/formations/praticien-hypnose-omni/conseil");

  const slot = page.getByRole("radio").first();
  await expect(slot).toBeVisible();
  await slot.click();
  await expect(slot).toHaveAttribute("aria-checked", "true");

  await page.getByRole("textbox", {name: "Prénom", exact: true}).fill("Camille");
  await page.getByRole("textbox", {name: "Nom", exact: true}).fill("Conseil");
  await page
    .getByRole("textbox", {name: "E-mail"})
    .fill(`camille.conseil.${stamp}@example.test`);
  await page.getByLabel("Téléphone").fill("+41 79 000 11 22");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", {name: "Réserver cet appel"}).click();

  await expect(page.getByRole("status")).toContainText("Cet horaire est réservé");
});

test("a visitor can send a written question instead of a call", async ({page}) => {
  const stamp = Date.now();
  await page.goto("/en/courses/omni-hypnosis-practitioner/advice?mode=write");

  await expect(page.getByRole("heading", {level: 1})).toHaveText(
    "A free fifteen-minute call",
  );
  await page.getByLabel("First name").fill("Elena");
  await page.getByLabel("Last name").fill("Writer");
  await page.getByLabel("Email").fill(`elena.writer.${stamp}@example.test`);
  await page.getByLabel("Phone").fill("+41 79 000 33 44");
  await page
    .getByLabel("Your question")
    .fill("Does this course suit a physician who already practises hypnosis?");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", {name: "Send the message"}).click();

  await expect(page.getByRole("status")).toContainText("Your message is with us");
});

test("the German course page still offers advice", async ({page}) => {
  await page.goto("/de/ausbildungen/omni-hypnose-praktiker");
  await expect(page.getByText("Eine Frage vor der Anmeldung?")).toBeVisible();
  await page.getByRole("link", {name: "Zeit wählen"}).click();
  await expect(page).toHaveURL(/\/beratung/);
  await expect(page.getByRole("heading", {level: 1})).toHaveText(
    "Ein kostenloses Gespräch von fünfzehn Minuten",
  );
});
