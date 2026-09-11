import {expect, test} from "@playwright/test";

test("unauthenticated visitors are sent to sign-in instead of admin or rooms", async ({
  page,
}) => {
  await page.goto("/en/admin/rooms");
  await expect(page).toHaveURL(/\/en\/sign-in/);
  await page.goto("/en/admin/settings");
  await expect(page).toHaveURL(/\/en\/sign-in/);
  await expect(page.getByRole("heading", {name: "Sign in"})).toBeVisible();

  await page.goto("/en/rooms");
  await expect(page).toHaveURL(/\/en\/sign-in/);
  await page.goto("/en/rooms/book");
  await expect(page).toHaveURL(/\/en\/sign-in/);
  await page.goto("/en/rooms/bookings");
  await expect(page).toHaveURL(/\/en\/sign-in/);
  await page.goto("/en/rooms/requests");
  await expect(page).toHaveURL(/\/en\/sign-in/);
  await page.goto("/en/rooms/requests/new");
  await expect(page).toHaveURL(/\/en\/sign-in/);
  await page.goto("/fr/salles/demandes");
  await expect(page).toHaveURL(/\/fr\/connexion/);
  await page.goto("/de/raeume/anfragen");
  await expect(page).toHaveURL(/\/de\/anmelden/);
  await page.goto("/en/admin/bookings");
  await expect(page).toHaveURL(/\/en\/sign-in/);
  await page.goto("/en/admin/requests");
  await expect(page).toHaveURL(/\/en\/sign-in/);
  await page.goto("/en/admin/billing");
  await expect(page).toHaveURL(/\/en\/sign-in/);
  await page.goto("/en/billing");
  await expect(page).toHaveURL(/\/en\/sign-in/);
  await page.goto("/en/billing/setup");
  await expect(page).toHaveURL(/\/en\/sign-in/);
  await page.goto("/en/billing/statements/11111111-1111-4111-8111-111111111111");
  await expect(page).toHaveURL(/\/en\/sign-in/);
  await page.goto("/fr/facturation");
  await expect(page).toHaveURL(/\/fr\/connexion/);
  await page.goto("/de/abrechnung");
  await expect(page).toHaveURL(/\/de\/anmelden/);

  await page.goto("/en/account/courses");
  await expect(page).toHaveURL(/\/en\/sign-in/);

  await page.goto("/en/staff/bookings");
  await expect(page).toHaveURL(/\/en\/sign-in/);
});

test("sign-in screens exist in FR, DE and EN", async ({page}) => {
  await page.goto("/fr/connexion");
  await expect(page.getByRole("heading", {name: "Connexion"})).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByRole("link", {name: "Créer un compte"})).toBeVisible();

  await page.goto("/de/anmelden");
  await expect(page.getByRole("heading", {name: "Anmelden"})).toBeVisible();

  await page.goto("/en/sign-in");
  await expect(page.getByRole("heading", {name: "Sign in"})).toBeVisible();
});

test("sign-up, forgot-password and account screens exist in FR, DE and EN", async ({
  page,
}) => {
  await page.goto("/fr/creer-un-compte");
  await expect(page.getByRole("heading", {name: "Créer un compte"})).toBeVisible();
  await expect(page.getByLabel("Prénom")).toBeVisible();

  await page.goto("/de/konto-erstellen");
  await expect(page.getByRole("heading", {name: "Konto erstellen"})).toBeVisible();

  await page.goto("/en/sign-up");
  await expect(page.getByRole("heading", {name: "Create an account"})).toBeVisible();

  await page.goto("/fr/mot-de-passe-oublie");
  await expect(page.getByRole("heading", {name: "Mot de passe oublié"})).toBeVisible();

  await page.goto("/de/passwort-vergessen");
  await expect(page.getByRole("heading", {name: "Passwort vergessen"})).toBeVisible();

  await page.goto("/en/forgot-password");
  await expect(page.getByRole("heading", {name: "Forgot password"})).toBeVisible();

  await page.goto("/en/account");
  await expect(page).toHaveURL(/\/en\/sign-in/);

  await page.goto("/fr/compte/formations");
  await expect(page).toHaveURL(/\/fr\/connexion/);

  await page.goto("/de/konto");
  await expect(page).toHaveURL(/\/de\/anmelden/);
});

test("staff CSV exports reject anonymous and basic-auth requests", async ({
  request,
}) => {
  const anonymous = await request.get("/api/staff/bookings.csv");
  expect(anonymous.status()).toBe(401);
  expect(anonymous.headers()["www-authenticate"]).toBeUndefined();

  const billingCsv = await request.get("/api/admin/billing.csv");
  expect(billingCsv.status()).toBe(401);
  expect(billingCsv.headers()["cache-control"]).toContain("no-store");

  const statementsCsv = await request.get("/api/admin/statements.csv");
  expect(statementsCsv.status()).toBe(401);
  expect(statementsCsv.headers()["cache-control"]).toContain("no-store");

  const certificate = await request.get(
    "/api/certificates/11111111-1111-4111-8111-111111111111/document",
  );
  expect(certificate.status()).toBe(401);
  expect(certificate.headers()["cache-control"]).toContain("no-store");

  const basic = await request.get("/api/staff/waitlist.csv", {
    headers: {
      authorization: `Basic ${Buffer.from("staff:change-me-locally").toString("base64")}`,
    },
  });
  expect(basic.status()).toBe(401);
});
