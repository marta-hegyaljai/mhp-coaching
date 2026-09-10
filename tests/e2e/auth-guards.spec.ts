import {expect, test} from "@playwright/test";

test("unauthenticated visitors are sent to sign-in instead of admin or rooms", async ({
  page,
}) => {
  await page.goto("/en/admin/users");
  await expect(page).toHaveURL(/\/en\/sign-in/);
  await expect(page.getByRole("heading", {name: "Sign in"})).toBeVisible();

  await page.goto("/en/rooms");
  await expect(page).toHaveURL(/\/en\/sign-in/);

  await page.goto("/en/staff/bookings");
  await expect(page).toHaveURL(/\/en\/sign-in/);
});

test("sign-in screens exist in FR, DE and EN", async ({page}) => {
  await page.goto("/fr/connexion");
  await expect(page.getByRole("heading", {name: "Connexion"})).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();

  await page.goto("/de/anmelden");
  await expect(page.getByRole("heading", {name: "Anmelden"})).toBeVisible();

  await page.goto("/en/sign-in");
  await expect(page.getByRole("heading", {name: "Sign in"})).toBeVisible();
});

test("staff CSV exports reject anonymous and basic-auth requests", async ({
  request,
}) => {
  const anonymous = await request.get("/api/staff/bookings.csv");
  expect(anonymous.status()).toBe(401);
  expect(anonymous.headers()["www-authenticate"]).toBeUndefined();

  const basic = await request.get("/api/staff/waitlist.csv", {
    headers: {
      authorization: `Basic ${Buffer.from("staff:change-me-locally").toString("base64")}`,
    },
  });
  expect(basic.status()).toBe(401);
});
